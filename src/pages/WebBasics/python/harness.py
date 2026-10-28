# The checker behind the Python exercises, run inside Pyodide (a Web Worker on
# the page, Node in scripts/checkPythonExercises.mjs). It runs your code in a
# fresh namespace, then every top-level statement of the exercise's tests one
# at a time, so one failing check never hides the others:
#   assert a == b, "label"   a check; on failure shows what a was and what b was
#   assert expr              a check that expr is truthy
#   anything else            setup (x = make()), only reported if it raises
# Checks may `await` (the async exercises), and so may your code at the top
# level, since asyncio.run() can't start a second loop inside the page's.
# `raises(Error, fn, *args)` is there for "this must raise" checks.

import ast
import inspect
import json
import linecache
import sys
import traceback

YOUR_CODE = "<your code>"
CHECK = "<check>"
MAX_OUT = 20_000
MAX_REPR = 300


class _Out:
    def __init__(self):
        self.parts = []
        self.size = 0

    def write(self, s):
        if self.size < MAX_OUT:
            self.parts.append(s)
            self.size += len(s)
        return len(s)

    def flush(self):
        pass

    def value(self):
        text = "".join(self.parts)
        return text if len(text) <= MAX_OUT else text[:MAX_OUT] + "\n… (output cut)"


def _register(filename, source):
    # So tracebacks can show the offending line of your code.
    linecache.cache[filename] = (len(source), None, source.splitlines(True), filename)


def _short(value):
    try:
        text = repr(value)
    except Exception as e:  # a broken __repr__ is your bug, not the checker's
        text = f"<repr failed: {type(e).__name__}>"
    return text if len(text) <= MAX_REPR else text[:MAX_REPR] + "…"


def _error(e):
    # Only the frames of your code: the harness's own frames are noise.
    te = traceback.TracebackException.from_exception(e)
    te.stack = traceback.StackSummary.from_list([f for f in te.stack if f.filename in (YOUR_CODE, CHECK)])
    frames = [f for f in te.stack if f.filename == YOUR_CODE]
    line = getattr(e, "lineno", None) if isinstance(e, SyntaxError) and e.filename == YOUR_CODE else None
    if frames:
        line = frames[-1].lineno
    return {"type": type(e).__name__, "text": "".join(te.format()).rstrip(), "line": line}


def raises(error, fn, *args, **kwargs):
    try:
        fn(*args, **kwargs)
    except error:
        return True
    return False


async def _value(node, ns):
    code = compile(ast.Expression(node), CHECK, "eval", flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
    result = eval(code, ns)
    if inspect.iscoroutine(result):
        result = await result
    return result


async def _check(stmt, tests, ns):
    if not isinstance(stmt, ast.Assert):
        code = compile(ast.Module([stmt], []), CHECK, "exec", flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
        try:
            result = eval(code, ns)
            if inspect.iscoroutine(result):
                await result
            return None
        except BaseException as e:
            return {"label": ast.get_source_segment(tests, stmt), "ok": False, "error": _error(e)}

    expr = ast.get_source_segment(tests, stmt.test)
    label = stmt.msg.value if isinstance(stmt.msg, ast.Constant) else None
    out = {"label": label or expr, "expr": expr if label else None, "ok": False}
    try:
        t = stmt.test
        if isinstance(t, ast.Compare) and len(t.ops) == 1 and isinstance(t.ops[0], ast.Eq):
            got = await _value(t.left, ns)
            want = await _value(t.comparators[0], ns)
            out["ok"] = bool(got == want)
            if not out["ok"]:
                out["got"] = _short(got)
                out["want"] = _short(want)
        else:
            got = await _value(t, ns)
            out["ok"] = bool(got)
            if not out["ok"]:
                out["got"] = _short(got)
    except BaseException as e:
        out["error"] = _error(e)
    return out


async def run(code, tests=""):
    out = _Out()
    ns = {"__name__": "__main__", "raises": raises}
    result = {"stdout": "", "error": None, "checks": []}
    saved = sys.stdout, sys.stderr
    sys.stdout = sys.stderr = out
    try:
        _register(YOUR_CODE, code)
        try:
            pending = eval(compile(code, YOUR_CODE, "exec", flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT), ns)
            if inspect.iscoroutine(pending):
                await pending
        except BaseException as e:
            result["error"] = _error(e)
        if result["error"] is None and tests.strip():
            _register(CHECK, tests)
            for stmt in ast.parse(tests).body:
                check = await _check(stmt, tests, ns)
                if check is not None:
                    result["checks"].append(check)
    finally:
        sys.stdout, sys.stderr = saved
    result["stdout"] = out.value()
    return json.dumps(result)
