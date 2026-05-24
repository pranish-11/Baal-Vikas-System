module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      apiUrl:
        process.env.EXPO_PUBLIC_API_URL || "http://192.168.2.108:8011",
    },
  };
};