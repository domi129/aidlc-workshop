import ApiClient from './apiClient';

async function fetcher(url) {
  return await ApiClient.get(url);
}

export default fetcher;
