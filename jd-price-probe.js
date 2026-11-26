/**
 * 京东比价 passthrough 探针（Shadowrocket）
 *
 * 仅用于定位详情页失败原因，不做任何正文改写：
 * - 页面能打开：说明 Shadowrocket 已成功取到并执行 script-path，问题在注入/响应头逻辑。
 * - 页面仍失败：说明 Shadowrocket 没取到 script-path，或 MITM/请求层本身有问题。
 *
 * 诊断完成后恢复为 jd-price-guard.js。
 */
try {
  $notification.post('京东比价', 'probe-v1 已执行', '');
} catch (e) {
  // 通知权限关闭时忽略；页面能否打开仍是判据
}
$done({});
