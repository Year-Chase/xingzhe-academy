-- V3.0A: user identity is scoped to the current WeChat mini-app.
-- New databases must be initialized without importing historical test users.
ALTER TABLE user
  ADD COLUMN wechatAppId varchar(100) NOT NULL;

ALTER TABLE user DROP INDEX IDX_0fda9260b0aaff9a5b8f38ac16;
ALTER TABLE user ADD CONSTRAINT uq_user_wechat_app_openid UNIQUE (wechatAppId, openid);
