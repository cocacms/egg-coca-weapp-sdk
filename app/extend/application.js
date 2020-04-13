"use strict";
const weappsdk = require("mp-sdk-rojer");
const dayjs = require("dayjs");

const WEAPPSDKS = Symbol("Application#sdks");

module.exports = {
  async weapp(key = "default") {
    if (!this[WEAPPSDKS]) {
      this[WEAPPSDKS] = {};
    }

    if (!this[WEAPPSDKMEMBER][key]) {
      const config = this.config.weapp[key];
      if (!config) {
        throw new Error("请先配置小程序sdk参数");
      }
      this[WEAPPSDKMEMBER][key] = weappsdk(
        ...config,
        async () => {
          return await this.get_token(key);
        },
        async value => {
          await this.set_token(key, value);
        }
      );
    }

    return this[WEAPPSDKMEMBER][key];
  },

  async get_token(key) {
    const token = await this.redis.get(`weappsdk.token.${key}`);
    this.logger.debug("[weappsdk] get member token from redis:", token);
    if (!token) return {};
    try {
      const tokenobj = JSON.parse(token);
      tokenobj.expires = dayjs.unix(tokenobj.expires).toDate();
      return tokenobj;
    } catch (error) {
      return {};
    }
  },

  async set_token(key, value) {
    value.expires = dayjs()
      .add(7000, "second")
      .unix();
    this.logger.debug("[weappsdk] set member token to redis:", value);
    await this.redis.set(`weappsdk.token.${key}`, JSON.stringify(value));
  }
};
