/**
 * 京东比价兼容层（Shadowrocket）
 *
 * 比价逻辑不复制在这里，运行时从固定提交的上游脚本加载；本文件只做三件事：
 * 1. 按官方语义校验 $response.body：只有 requires-body=true 才是解压后的字符串，
 *    没有正文时直接 $done({}) 原样放行。
 * 2. 替换正文时移除原响应的 Content-Encoding / Content-Length / Transfer-Encoding，
 *    避免已解压的 HTML 被客户端按 gzip 再解一次或被旧长度截断。
 * 3. 改写正文时按 UTF-8 重算 Content-Length；只删旧长度会让客户端按错误边界
 *    切分 HTML。
 * 4. 最长等待 5 秒；脚本报错、上游拉取失败或不结束时一律 $done({})，
 *    保证京东商品详情页不会因为比价脚本卡住而整页“网络请求失败”。
 */
const SOURCE = 'https://raw.githubusercontent.com/wf021325/qx/cfcf6365f7bc9bc0cdae2538594ca04c96b2c3f0/js/jd_price.js';
const BUILD = 'v2';
const realDone = $done;
const isRequest = typeof $response === 'undefined';
let finished = false;

function notify(text) {
  if (isRequest) return;
  try {
    $notification.post('京东比价', BUILD + ' ' + text, '');
  } catch (e) {
    // 通知权限关闭时忽略
  }
}

function finish(result, reason) {
  if (finished) return;
  finished = true;
  if (reason) notify(reason);
  realDone(result || {});
}

function utf8Length(text) {
  try {
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(text).length;
    }
  } catch (e) {
    // 回退到 encodeURIComponent
  }
  return unescape(encodeURIComponent(text)).length;
}

function cleanHeaders(body) {
  const headers = {};
  const source = (typeof $response !== 'undefined' && $response.headers) || {};
  let hasContentType = false;
  for (const key of Object.keys(source)) {
    if (/^(content-encoding|content-length|transfer-encoding)$/i.test(key)) continue;
    if (/^content-type$/i.test(key)) hasContentType = true;
    headers[key] = source[key];
  }
  if (!hasContentType) headers['Content-Type'] = 'text/html; charset=utf-8';
  headers['Content-Length'] = String(utf8Length(body));
  return headers;
}

function patchedDone(result) {
  if (!result || typeof result.body !== 'string') {
    return finish(result && result.body === undefined ? result : {}, '未取到正文，已原样放行');
  }
  finish(
    { body: result.body, headers: cleanHeaders(result.body) },
    '已注入价格表格',
  );
}

if (!isRequest) notify('脚本已执行');

setTimeout(() => finish({}, '5 秒未完成，已原样放行'), isRequest ? 2000 : 5000);

$httpClient.get({ url: SOURCE }, (error, response, data) => {
  if (error || !data) return finish({}, '脚本下载失败，已原样放行');
  try {
    new Function('$done', data)(patchedDone);
  } catch (e) {
    return finish({}, '脚本执行异常，已原样放行');
  }
  if (isRequest) finish({});
});
