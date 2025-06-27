import * as vscode from "vscode";

export class Logger {
  private static outputChannel: vscode.OutputChannel | null = null;

  static initialize(channelName: string = "CommiTail") {
    if (!this.outputChannel) {
      this.outputChannel = vscode.window.createOutputChannel(channelName);
    }
  }

  static info(message: string) {
    this.log("INFO", message);
  }

  static warn(message: string) {
    this.log("WARN", message);
  }

  static error(message: string, error?: Error) {
    this.log("ERROR", message);
    if (error) {
      this.log("ERROR", `Stack trace: ${error.stack}`);
    }
  }

  static debug(message: string) {
    this.log("DEBUG", message);
  }

  private static log(level: string, message: string) {
    const timestamp = new Date().toLocaleString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;

    if (this.outputChannel) {
      this.outputChannel.appendLine(logMessage);
    }

    // 同时输出到控制台
    console.log(logMessage);
  }

  static dispose() {
    if (this.outputChannel) {
      this.outputChannel.dispose();
      this.outputChannel = null;
    }
  }
}
