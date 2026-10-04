export const USER_CACHE_TTL_SECONDS = 60;

export const userCacheKeys = {
  all: 'users:all',
  byId: (id: string) => `users:${id}`,
};
