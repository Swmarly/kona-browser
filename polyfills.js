if (typeof globalThis.File === 'undefined') {
  const { Blob } = require('node:buffer');

  class File extends Blob {
    constructor(fileBits, fileName, options = {}) {
      if (arguments.length < 2) {
        throw new TypeError('Failed to construct "File": 2 arguments required, but only ' + arguments.length + ' present.');
      }

      const name = typeof fileName === 'string' ? fileName : String(fileName ?? '');
      const lastModified =
        typeof options.lastModified === 'number'
          ? Math.trunc(options.lastModified)
          : Date.now();

      super(fileBits, options);

      Object.defineProperties(this, {
        name: {
          value: name,
          enumerable: false,
          writable: false,
          configurable: false
        },
        lastModified: {
          value: lastModified,
          enumerable: false,
          writable: false,
          configurable: false
        }
      });
    }

    get [Symbol.toStringTag]() {
      return 'File';
    }
  }

  globalThis.File = File;
}
