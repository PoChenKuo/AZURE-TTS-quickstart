import path from "path";
import readline from "readline";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cleanupScript = path.resolve(__dirname, "cleanup_routine.js");
const timestampScript = path.resolve(__dirname, "timestamp_synthesis.js");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "Enter text (or /exit): "
});

function printAbovePrompt(message) {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    console.log(message);
    rl.prompt();
}

function pipeChildOutput(stream, prefix) {
    if (!stream) {
        return;
    }
    stream.setEncoding("utf8");
    let buffer = "";
    stream.on("data", (chunk) => {
        buffer += chunk;
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, newlineIndex).replace(/\r$/, "");
            if (line) {
                printAbovePrompt(`${prefix}${line}`);
            }
            buffer = buffer.slice(newlineIndex + 1);
        }
    });
    stream.on("end", () => {
        if (buffer.trim()) {
            printAbovePrompt(`${prefix}${buffer.trimEnd()}`);
        }
        buffer = "";
    });
}

function spawnCleanupRoutine() {
    const child = spawn(
        process.execPath,
        [cleanupScript],
        { stdio: ["ignore", "pipe", "pipe"] }
    );

    pipeChildOutput(child.stdout, "[cleanup] ");
    pipeChildOutput(child.stderr, "[cleanup] ");

    child.on("exit", (code, signal) => {
        if (signal) {
            printAbovePrompt(`Cleanup routine exited due to signal ${signal}.`);
        }
        else {
            printAbovePrompt(`Cleanup routine exited with code ${code}.`);
        }
    });

    child.on("error", (err) => {
        printAbovePrompt(`Failed to start cleanup routine: ${err.message}`);
    });

    return child;
}

function spawnSynthesis(text) {
    printAbovePrompt(`Queuing synthesis for: "${text}"`);
    const child = spawn(
        process.execPath,
        [timestampScript, text],
        { stdio: ["inherit", "inherit", "inherit"] }
    );

    child.on("exit", (code) => {
        if (code === 0) {
            printAbovePrompt("Synthesis completed.");
        }
        else {
            printAbovePrompt(`Synthesis failed with exit code ${code}.`);
        }
    });

    child.on("error", (err) => {
        printAbovePrompt(`Failed to start synthesis: ${err.message}`);
    });
}

const cleanupChild = spawnCleanupRoutine();

console.log("Cleanup routine is running in the background.");
console.log("Type text to synthesize, or /exit to quit.");
rl.prompt();

function shutdown(code = 0) {
    rl.close();
    if (cleanupChild && !cleanupChild.killed) {
        cleanupChild.kill();
    }
    process.exit(code);
}

rl.on("line", (line) => {
    const input = line.trim();
    if (!input) {
        rl.prompt();
        return;
    }

    if (input === "/exit" || input === "/quit") {
        shutdown(0);
        return;
    }

    spawnSynthesis(input);
    rl.prompt();
});

rl.on("SIGINT", () => {
    shutdown(0);
});

process.on("SIGINT", () => {
    shutdown(0);
});

process.on("SIGTERM", () => {
    shutdown(0);
});
