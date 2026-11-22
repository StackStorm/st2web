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

// Hash-based history (#/path?search), the subset of the `history` package's API the router uses.

export function parsePath(path) {
  let pathname = path || '/';
  let search = '';
  let hash = '';

  const hashIndex = pathname.indexOf('#');
  if (hashIndex !== -1) {
    hash = pathname.slice(hashIndex);
    pathname = pathname.slice(0, hashIndex);
  }

  const searchIndex = pathname.indexOf('?');
  if (searchIndex !== -1) {
    search = pathname.slice(searchIndex);
    pathname = pathname.slice(0, searchIndex);
  }

  return {
    pathname: pathname || '/',
    search: search === '?' ? '' : search,
    hash: hash === '#' ? '' : hash,
  };
}

export function createPath({ pathname = '/', search = '', hash = '' }) {
  return pathname
    + (search && search !== '?' ? (search.startsWith('?') ? search : `?${search}`) : '')
    + (hash && hash !== '#' ? (hash.startsWith('#') ? hash : `#${hash}`) : '');
}

// Resolve a string or partial location against the current one, like history's createLocation.
export function createLocation(to, currentLocation) {
  const location = typeof to === 'string' ? parsePath(to) : { search: '', hash: '', ...to };

  if (currentLocation) {
    if (!location.pathname) {
      location.pathname = currentLocation.pathname;
    }
    else if (!location.pathname.startsWith('/')) {
      location.pathname = new URL(location.pathname, `http://localhost${currentLocation.pathname}`).pathname;
    }
  }

  return location;
}

// Browsers keep the hash percent-encoded (a space reads back as %20), so decode the pathname the
// way the `history` package did; refs with spaces must match after a reload, bookmark or Back.
function decodePathname(location) {
  try {
    return { ...location, pathname: decodeURI(location.pathname) };
  }
  catch (e) {
    return location;
  }
}

export function createHashHistory(win = window) {
  const listeners = new Set();
  const read = () => decodePathname(parsePath(win.location.hash.replace(/^#/, '')));

  const history = {
    action: 'POP',
    location: read(),

    listen(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    push(to) {
      update(createLocation(to, history.location), 'PUSH');
    },

    replace(to) {
      update(createLocation(to || history.location, history.location), 'REPLACE');
    },
  };

  function notify(location, action) {
    history.location = location;
    history.action = action;
    listeners.forEach(listener => listener(location, action));
  }

  function update(location, action) {
    const path = createPath(location);
    const url = `${win.location.pathname}${win.location.search}#${path}`;

    if (action === 'REPLACE') {
      win.history.replaceState(null, '', url);
    }
    else if (createPath(history.location) !== path) {
      win.history.pushState(null, '', url);
    }

    notify(parsePath(path), action);
  }

  // Back/forward and links typed into the address bar.
  const onPop = () => {
    const location = read();

    if (createPath(location) !== createPath(history.location)) {
      notify(location, 'POP');
    }
  };
  win.addEventListener('popstate', onPop);
  win.addEventListener('hashchange', onPop);

  return history;
}

const history = typeof window === 'undefined' ? null : createHashHistory();

export default history;
