import axios, { AxiosRequestConfig } from 'axios';

export async function request(config: AxiosRequestConfig<any>) {
  try {
    const res = await axios(config);
    if (res.status < 200 || res.status >= 300) {
      return {
        success: false,
        data: null,
        message: `status:${res.status} statusText:${res.statusText} data:${res.data}`,
      };
    }
    return {
      success: true,
      data: res.data,
      message: '',
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      message: error?.response
        ? `${error.response.status}:${JSON.stringify(error.response.data)}`
        : `${error.code}: ${error.message}`,
    };
  }
}
