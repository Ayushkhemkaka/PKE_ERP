const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
    if (!error) {
        return fallback;
    }

    if (typeof error === 'string') {
        return error;
    }

    if (error.response?.data?.message) {
        return error.response.data.message;
    }

    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        return 'Network error. Please check your connection and try again.';
    }

    if (error.message) {
        return error.message;
    }

    if (error.response?.status) {
        return `Request failed with status ${error.response.status}. Please try again.`;
    }

    return fallback;
};

export { getErrorMessage };
