// Copyright 2019 Extreme Networks, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { expect } from 'chai';

import isValueFormat from '..';

describe('value-format', () => {
  it('accepts empty arguments', () => {
    expect(isValueFormat(null, null)).to.equal(true);
    expect(isValueFormat(null, 'foo')).to.equal(true);
    expect(isValueFormat('foo', null)).to.equal(true);
  });

  it('rejects invalid formats', () => {
    expect(isValueFormat('foo', 'bar')).to.equal(false);
  });

  describe('date-time validator', () => {
    it('accepts', () => {
      expect(isValueFormat('date-time', '1990-01-01T00:00:00.000+00:00')).to.equal(true);
      expect(isValueFormat('date-time', '1990-01-01T00:00:00.000-00:00')).to.equal(true);
    });

    it('rejects', () => {
      expect(isValueFormat('date-time', '0000-00-00T00:00:00.000+00:000')).to.equal(false);
    });
  });

  describe('email validator', () => {
    it('accepts', () => {
      expect(isValueFormat('email', 'user@domain.tld')).to.equal(true);
      expect(isValueFormat('email', 'user@sub.domain.tld')).to.equal(true);
    });

    it('rejects', () => {
      expect(isValueFormat('email', 'user@domain')).to.equal(false);
      expect(isValueFormat('email', 'user@domain.')).to.equal(false);
      expect(isValueFormat('email', 'user@.tld')).to.equal(false);
      expect(isValueFormat('email', '.@domain.tld')).to.equal(false);
    });
  });

  describe('hostname validator', () => {
    it('accepts', () => {
      expect(isValueFormat('hostname', 'hostname')).to.equal(true);
      expect(isValueFormat('hostname', 'hostname.tld')).to.equal(true);
      expect(isValueFormat('hostname', 'hostnamehostnamehostnamehostnamehostnamehostnamehostnamehostnam.tld')).to.equal(true);
    });

    it('rejects', () => {
      expect(isValueFormat('hostname', 'hostname.')).to.equal(false);
      expect(isValueFormat('hostname', '-hostname.tld')).to.equal(false);
      expect(isValueFormat('hostname', 'hostnamehostnamehostnamehostnamehostnamehostnamehostnamehostname.tld')).to.equal(false);
    });
  });

  describe('ipv4 validator', () => {
    it('accepts', () => {
      expect(isValueFormat('ipv4', '0.0.0.0')).to.equal(true);
      expect(isValueFormat('ipv4', '255.255.255.255')).to.equal(true);
    });

    it('rejects', () => {
      expect(isValueFormat('ipv4', '0')).to.equal(false);
      expect(isValueFormat('ipv4', '0.0')).to.equal(false);
      expect(isValueFormat('ipv4', '0.0.0')).to.equal(false);
      expect(isValueFormat('ipv4', '0.')).to.equal(false);
      expect(isValueFormat('ipv4', '0.0.')).to.equal(false);
      expect(isValueFormat('ipv4', '0.0.0.')).to.equal(false);
      expect(isValueFormat('ipv4', '256.0.0.0')).to.equal(false);
      expect(isValueFormat('ipv4', '270.0.0.0')).to.equal(false);
      expect(isValueFormat('ipv4', '300.0.0.0')).to.equal(false);
    });
  });

  describe('ipv6 validator', () => {
    it('accepts', () => {
      expect(isValueFormat('ipv6', 'FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF')).to.equal(true);
      expect(isValueFormat('ipv6', 'FFFF:FFFF:FFFF:FFFF:FFFF:FFFF::FFFF')).to.equal(true);
      expect(isValueFormat('ipv6', 'FFFF:FFFF:FFFF:FFFF:FFFF::FFFF')).to.equal(true);
      expect(isValueFormat('ipv6', 'FFFF:FFFF:FFFF:FFFF::FFFF')).to.equal(true);
      expect(isValueFormat('ipv6', 'FFFF:FFFF:FFFF::FFFF')).to.equal(true);
      expect(isValueFormat('ipv6', 'FFFF:FFFF::FFFF')).to.equal(true);
      expect(isValueFormat('ipv6', 'FFFF::FFFF')).to.equal(true);
      expect(isValueFormat('ipv6', '::')).to.equal(true);
      expect(isValueFormat('ipv6', '::255.255.255.255')).to.equal(true);
      expect(isValueFormat('ipv6', '::ffff:255.255.255.255')).to.equal(true);
      expect(isValueFormat('ipv6', '::ffff:0000:255.255.255.255')).to.equal(true);
      expect(isValueFormat('ipv6', 'FFFF:FFFF:FFFF:FFFF::255.255.255.255')).to.equal(true);
    });

    it('rejects', () => {
      expect(isValueFormat('ipv6', 'FFFF:::FFFF')).to.equal(false);
      expect(isValueFormat('ipv6', ':::')).to.equal(false);
    });
  });

  describe('ip validator', () => {
    it('accepts', () => {
      expect(isValueFormat('ip', '0.0.0.0')).to.equal(true);
      expect(isValueFormat('ip', '255.255.255.255')).to.equal(true);
      expect(isValueFormat('ip', 'FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF')).to.equal(true);
      expect(isValueFormat('ip', '::')).to.equal(true);
    });

    it('rejects', () => {
      expect(isValueFormat('ip', '256.0.0.0')).to.equal(false);
      expect(isValueFormat('ip', 'FFFF:::FFFF')).to.equal(false);
      expect(isValueFormat('ip', ':::')).to.equal(false);
    });
  });

  describe('uri validator', () => {
    it('accepts', () => {
      expect(isValueFormat('uri', 'http://hostname')).to.equal(true);
      expect(isValueFormat('uri', 'http://hostname/foo')).to.equal(true);
      expect(isValueFormat('uri', 'https://hostname')).to.equal(true);
      expect(isValueFormat('uri', 'https://hostname/foo')).to.equal(true);
      expect(isValueFormat('uri', 'http://hostname.tld')).to.equal(true);
      expect(isValueFormat('uri', 'http://hostname.tld/foo')).to.equal(true);
      expect(isValueFormat('uri', 'https://hostname.tld')).to.equal(true);
      expect(isValueFormat('uri', 'https://hostname.tld/foo')).to.equal(true);
    });

    it('rejects', () => {
      expect(isValueFormat('uri', '://hostname')).to.equal(false);
    });
  });
});
