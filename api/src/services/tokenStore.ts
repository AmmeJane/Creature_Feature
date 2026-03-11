let userToken: string | null = null;

export const setUserToken = (token: string) => {
  userToken = token;
};

export const getUserToken = () => userToken;

export const clearUserToken = () => {
  userToken = null;
};