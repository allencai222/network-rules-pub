/**
 * 京东比价请求头兼容层（Shadowrocket）
 *
 * 京东详情页返回 gzip + HTTP/2；强制 identity 让服务端返回明文 HTML，
 * 避免响应脚本 requires-body 在解压/缓冲阶段失败导致整页“网络请求失败”。
 */
const headers = $request.headers || {};
const next = {};
for (const key of Object.keys(headers)) {
  if (key.toLowerCase() !== 'accept-encoding') next[key] = headers[key];
}
next['Accept-Encoding'] = 'identity';
$done({ headers: next });
