export const sleep = async (ts: number) => {
  await new Promise((resolve, _) => {
    setTimeout(() => resolve(true), ts);
  });
};

export const toJSON = (data) => {
  return JSON.stringify(
    data,
    (_, value) => (typeof value === "bigint" ? value.toString() : value) // return everything else unchanged
  );
};

export const toObject = (data) => {
  return JSON.parse(data);
};
