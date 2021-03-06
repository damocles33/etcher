/*
 * Copyright 2017 resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const m = require('mochainon');
const utils = require('../../lib/shared/utils');
const path = require('path');

describe('Shared: Utils', function() {

  describe('.makeFlatStartCaseObject()', function() {

    it('should return undefined if given undefined', function() {
      m.chai.expect(utils.makeFlatStartCaseObject(undefined)).to.be.undefined;
    });

    it('should return flat object with start case keys if given nested object', function() {
      const object = {
        person: {
          firstName: 'John',
          lastName: 'Doe',
          address: {
            streetNumber: 13,
            streetName: 'Elm'
          }
        }
      };

      m.chai.expect(utils.makeFlatStartCaseObject(object)).to.deep.equal({
        'Person First Name': 'John',
        'Person Last Name': 'Doe',
        'Person Address Street Number': 13,
        'Person Address Street Name': 'Elm'
      });

    });

    it('should return an object with the key `value` if given `false`', function() {
      m.chai.expect(utils.makeFlatStartCaseObject(false)).to.deep.equal({
        Value: false
      });
    });

    it('should return an object with the key `value` if given `null`', function() {
      m.chai.expect(utils.makeFlatStartCaseObject(null)).to.deep.equal({
        Value: null
      });
    });

    it('should preserve environment variable', function() {
      m.chai.expect(utils.makeFlatStartCaseObject({
        ETCHER_DISABLE_UPDATES: true
      })).to.deep.equal({
        ETCHER_DISABLE_UPDATES: true
      });
    });

    it('should preserve environment variables inside objects', function() {
      m.chai.expect(utils.makeFlatStartCaseObject({
        foo: {
          FOO_BAR_BAZ: 3
        }
      })).to.deep.equal({
        'Foo FOO_BAR_BAZ': 3
      });
    });

    it('should insert space after key starting with number', function() {
      m.chai.expect(utils.makeFlatStartCaseObject({
        foo: {
          '1key': 1
        }
      })).to.deep.equal({
        'Foo 1 Key': 1
      });
    });

    it('should not modify start case keys', function() {
      m.chai.expect(utils.makeFlatStartCaseObject({
        Foo: {
          'Start Case Key': 42
        }
      })).to.deep.equal({
        'Foo Start Case Key': 42
      });
    });

    it('should not modify arrays', function() {
      m.chai.expect(utils.makeFlatStartCaseObject([ 1, 2, {
        nested: 3
      } ])).to.deep.equal([ 1, 2, {
        Nested: 3
      } ]);
    });

    it('should not modify nested arrays', function() {
      m.chai.expect(utils.makeFlatStartCaseObject({
        values: [ 1, 2, {
          nested: 3
        } ]
      })).to.deep.equal({
        Values: [ 1, 2, {
          Nested: 3
        } ]
      });
    });

    it('should leave nested arrays nested', function() {
      m.chai.expect(utils.makeFlatStartCaseObject([ 1, 2, [ 3, 4 ] ])).to.deep.equal([ 1, 2, [ 3, 4 ] ]);
    });

  });

  describe('.hideAbsolutePathsInObject()', function() {

    it('should return undefined if given undefined', function() {
      m.chai.expect(utils.hideAbsolutePathsInObject(undefined)).to.be.undefined;
    });

    it('should return null if given null', function() {
      m.chai.expect(utils.hideAbsolutePathsInObject(null)).to.be.null;
    });

    it('should return a clone of the object if there are no paths in the object', function() {
      const object = {
        numberProperty: 1,
        nested: {
          otherProperty: 'value'
        }
      };
      m.chai.expect(utils.hideAbsolutePathsInObject(object)).to.not.equal(object);
      m.chai.expect(utils.hideAbsolutePathsInObject(object)).to.deep.equal(object);
    });

    describe('given UNIX paths', function() {

      beforeEach(function() {
        this.isAbsolute = path.isAbsolute;
        this.basename = path.basename;
        path.isAbsolute = path.posix.isAbsolute;
        path.basename = path.posix.basename;
      });

      afterEach(function() {
        path.isAbsolute = this.isAbsolute;
        path.basename = this.basename;
      });

      it('should replace absolute paths with the basename', function() {
        const object = {
          prop1: 'some value',
          prop2: '/home/john/rpi.img'
        };

        m.chai.expect(utils.hideAbsolutePathsInObject(object)).to.deep.equal({
          prop1: 'some value',
          prop2: 'rpi.img'
        });
      });

      it('should replace nested absolute paths with the basename', function() {
        const object = {
          nested: {
            path: '/home/john/rpi.img'
          }
        };

        m.chai.expect(utils.hideAbsolutePathsInObject(object)).to.deep.equal({
          nested: {
            path: 'rpi.img'
          }
        });
      });

      it('should not alter /dev/sdb', function() {
        const object = {
          nested: {
            path: '/dev/sdb'
          }
        };

        m.chai.expect(utils.hideAbsolutePathsInObject(object)).to.deep.equal({
          nested: {
            path: '/dev/sdb'
          }
        });
      });

      it('should not alter relative paths', function() {
        const object = {
          path: 'foo/bar'
        };

        m.chai.expect(utils.hideAbsolutePathsInObject(object)).to.deep.equal({
          path: 'foo/bar'
        });
      });

      it('should handle arrays', function() {
        m.chai.expect(utils.hideAbsolutePathsInObject({
          foo: 'foo',
          bar: [
            {
              path: '/foo/bar/baz'
            },
            {
              path: '/foo/bar/baz'
            },
            {
              path: '/foo/bar/baz'
            }
          ]
        })).to.deep.equal({
          foo: 'foo',
          bar: [
            {
              path: 'baz'
            },
            {
              path: 'baz'
            },
            {
              path: 'baz'
            }
          ]
        });
      });

    });

    describe('given Windows paths', function() {

      beforeEach(function() {
        this.isAbsolute = path.isAbsolute;
        this.basename = path.basename;
        path.isAbsolute = path.win32.isAbsolute;
        path.basename = path.win32.basename;
      });

      afterEach(function() {
        path.isAbsolute = this.isAbsolute;
        path.basename = this.basename;
      });

      it('should replace absolute paths with the basename', function() {
        const object = {
          prop1: 'some value',
          prop2: 'C:\\Users\\John\\rpi.img'
        };

        m.chai.expect(utils.hideAbsolutePathsInObject(object)).to.deep.equal({
          prop1: 'some value',
          prop2: 'rpi.img'
        });

      });

      it('should replace nested absolute paths with the basename', function() {
        const object = {
          nested: {
            path: 'C:\\Users\\John\\rpi.img'
          }
        };

        m.chai.expect(utils.hideAbsolutePathsInObject(object)).to.deep.equal({
          nested: {
            path: 'rpi.img'
          }
        });
      });

      it('should not alter \\\\.\\PHYSICALDRIVE1', function() {
        const object = {
          nested: {
            path: '\\\\.\\PHYSICALDRIVE1'
          }
        };

        m.chai.expect(utils.hideAbsolutePathsInObject(object)).to.deep.equal({
          nested: {
            path: '\\\\.\\PHYSICALDRIVE1'
          }
        });
      });

      it('should not alter relative paths', function() {
        const object = {
          path: 'foo\\bar'
        };

        m.chai.expect(utils.hideAbsolutePathsInObject(object)).to.deep.equal({
          path: 'foo\\bar'
        });
      });

      it('should handle arrays', function() {
        m.chai.expect(utils.hideAbsolutePathsInObject({
          foo: 'foo',
          bar: [ {
            path: 'C:\\foo\\bar\\baz'
          }, {
            path: 'C:\\foo\\bar\\baz'
          }, {
            path: 'C:\\foo\\bar\\baz'
          } ]
        })).to.deep.equal({
          foo: 'foo',
          bar: [ {
            path: 'baz'
          }, {
            path: 'baz'
          }, {
            path: 'baz'
          } ]
        });
      });

    });

  });

});
