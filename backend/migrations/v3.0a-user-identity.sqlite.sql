-- V3.0A: user identity is scoped to the current WeChat mini-app.
-- The supported new-DB path uses the V2.9H baseline, which already has both columns.
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_wechat_app_openid ON user (wechatAppId, openid);
