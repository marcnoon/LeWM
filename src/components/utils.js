
// It's better to have standalone utility functions than to modify Array.prototype.

export const getMin = (arr) => {
  if (arr.length === 0) return null;
  return Math.min.apply(Math, arr);
};

export const getMax = (arr) => {
  if (arr.length === 0) return null;
  return Math.max.apply(Math, arr);
};

export const getMedian = (arr) => {
  if (arr.length === 0) return null;
  const floatArr = arr.map(num => parseFloat(num));
  const sortedArray = floatArr.sort((prev, curr) => prev - curr);
  const midIndex = Math.trunc((sortedArray.length - 1) / 2);
  return sortedArray[midIndex];
};

export const getAverage = (arr) => {
  if (arr.length === 0) return null;
  const sum = arr.reduce((prev, curr) => prev + curr, 0);
  return sum / arr.length;
};

// Helper for gcdArray
const gcd2 = (a, b) => {
  a = Math.abs(a);
  b = Math.abs(b);
  while(b) {
    [a, b] = [b, a % b];
  }
  return a;
}

// GCD is defined for integers. This implementation rounds the numbers.
export const gcdArray = (arr) => {
  if (!arr || arr.length === 0) return null;
  const intArr = arr.map(n => Math.round(n)).filter(n => n > 0);
  if (intArr.length === 0) return null;
  return intArr.reduce((a, b) => gcd2(a, b));
};