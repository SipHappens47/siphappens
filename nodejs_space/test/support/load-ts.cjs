// Loads backend TypeScript sources in-process for isolated regressions.
// No Nest bootstrap, Prisma client, credentials, network, DB or storage:
// framework imports are replaced by inert stubs and callers pass fakes for
// anything with side effects (prisma, ../lib/s3, ../lib/email, ...).
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

class HttpException extends Error {
  constructor(message, status) {
    super(typeof message === 'string' ? message : JSON.stringify(message));
    this.status = status;
  }
  getStatus() { return this.status; }
}
const httpError = (status) => class extends HttpException {
  constructor(message) { super(message, status); }
};
const BadRequestException = httpError(400);
const UnauthorizedException = httpError(401);
const ForbiddenException = httpError(403);
const NotFoundException = httpError(404);
const ConflictException = httpError(409);

class Logger {
  log() {}
  warn() {}
  error() {}
  debug() {}
}

const decoratorFactory = () => () => undefined;
const inert = new Proxy({}, { get: () => decoratorFactory });

const nestCommon = new Proxy({
  HttpException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  Logger,
  HttpStatus: { OK: 200, CREATED: 201, BAD_REQUEST: 400, FORBIDDEN: 403, NOT_FOUND: 404, TOO_MANY_REQUESTS: 429 },
}, { get: (target, key) => (key in target ? target[key] : decoratorFactory) });

const PASSTHROUGH = new Set(['crypto', 'node:crypto', 'bcryptjs']);
const SRC = path.join(__dirname, '..', '..', 'src');

// relativePath is relative to nodejs_space/src. stubs maps an import
// specifier (exactly as written in the source) to the module to return.
function loadTs(relativePath, stubs = {}, cache = new Map()) {
  const filename = path.join(SRC, relativePath.endsWith('.ts') ? relativePath : `${relativePath}.ts`);
  if (cache.has(filename)) return cache.get(filename);
  const source = fs.readFileSync(filename, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2021,
      experimentalDecorators: true,
    },
  });
  const module = { exports: {} };
  cache.set(filename, module.exports);
  const localRequire = (name) => {
    if (Object.prototype.hasOwnProperty.call(stubs, name)) return stubs[name];
    if (name === '@nestjs/common') return nestCommon;
    if (name.startsWith('@nestjs/')) return inert;
    if (PASSTHROUGH.has(name)) return require(name);
    if (name.endsWith('/jwt-auth.guard')) return { JwtAuthGuard: class {} };
    if (name.startsWith('.')) {
      const target = path.relative(SRC, path.join(path.dirname(filename), name));
      return loadTs(target, stubs, cache);
    }
    throw new Error(`Unexpected import in isolated regression: ${name} (from ${relativePath})`);
  };
  const wrapper = vm.runInThisContext(
    `(function (exports, require, module, __filename, __dirname) {${outputText}\n})`,
    { filename },
  );
  wrapper(module.exports, localRequire, module, filename, path.dirname(filename));
  cache.set(filename, module.exports);
  return module.exports;
}

module.exports = {
  loadTs,
  HttpException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
};
