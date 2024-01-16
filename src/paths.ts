import { tmpdir, userInfo, homedir } from "os";
import { join } from "path";
import { exec, ExecException } from 'child_process';
import { get } from "http";

function getDarwinUserTempDir(): Promise<string> {
    return new Promise((resolve, reject) => {
        exec('getconf DARWIN_USER_TEMP_DIR', (error: ExecException | null, stdout: string, stderr: string) => {
            if (error) {
                resolve('/tmp/');
                return;
            }
            const darwinUserTempDir: string = stdout.trim();
            resolve(darwinUserTempDir);
        });
    });
}

export function getCommunicationDirPath() {
  const info = userInfo();

  // NB: On Windows, uid < 0, and the tmpdir is user-specific, so we don't
  // bother with a suffix
  const suffix = info.uid >= 0 ? `-${info.uid}` : "";

  // See https://github.com/talonhub/community/issues/966 for why we do
  // per-os directories
  if (process.platform === "win32") {
    return join(`${homedir()}\\AppData\\Roaming\\talon\\`, `vscode-command-server${suffix}`);
  }
  else if (process.platform === "darwin") {
    let darwinUserTempDir: string = "/tmp/";
    getDarwinUserTempDir().then((value: string) => {
        darwinUserTempDir = value;
    })
    .catch((reason: any) => {
        darwinUserTempDir = "/tmp/";
  });
    return join(darwinUserTempDir, `vscode-command-server${suffix}`);
  }
  else if (process.platform === "linux") {
    // Favor XDG_RUNTIME_DIR as it is a ramdisk and won't be overridden like TMPDIR
    return join(process.env.XDG_RUNTIME_DIR || "/tmp/", `vscode-command-server${suffix}`);
  }
  else {
    return join(tmpdir(), `vscode-command-server${suffix}`);
  }
}

export function getSignalDirPath(): string {
  return join(getCommunicationDirPath(), "signals");
}

export function getRequestPath() {
  return join(getCommunicationDirPath(), "request.json");
}

export function getResponsePath() {
  return join(getCommunicationDirPath(), "response.json");
}
