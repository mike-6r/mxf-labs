import { CopyCodeButton } from "@/components/content/copy-code-button";

function inlineCode(text: string) {
  const parts = text.split(/(`[^`]+`)/g);

  return parts.map((part, index) =>
    part.startsWith("`") && part.endsWith("`") ? (
      <code key={index} className="rounded bg-white/10 px-1.5 py-0.5 text-[#ffd8d8]">
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    ),
  );
}

export function MarkdownBlock({ body }: { body: string }) {
  const lines = body.split(/\r?\n/);
  const nodes: React.ReactNode[] = [];
  let code: string[] = [];
  let codeLanguage = "text";
  let inCode = false;

  lines.forEach((line, index) => {
    if (line.startsWith("```")) {
      if (inCode) {
        const codeValue = code.join("\n");
        nodes.push(
          <div key={`code-${index}`} className="relative my-4">
            <div className="flex items-center justify-between rounded-t-md border border-b-0 border-white/10 bg-white/[0.045] px-4 py-2">
              <span className="font-mono text-xs uppercase tracking-[0.16em] text-white/36">{codeLanguage}</span>
            </div>
            <pre className="overflow-x-auto rounded-b-md border border-white/10 bg-black/40 p-4 pr-24 text-sm text-[#ffd8d8]">
              <code>{codeValue}</code>
            </pre>
            <CopyCodeButton value={codeValue} />
          </div>,
        );
        code = [];
        codeLanguage = "text";
      } else {
        codeLanguage = line.replace("```", "").trim() || "text";
      }
      inCode = !inCode;
      return;
    }

    if (inCode) {
      code.push(line);
      return;
    }

    if (!line.trim()) {
      nodes.push(<div key={index} className="h-3" />);
      return;
    }

    if (line.startsWith("## ")) {
      nodes.push(
        <h2 key={index} className="mt-8 text-2xl font-semibold text-white">
          {line.replace("## ", "")}
        </h2>,
      );
      return;
    }

    if (line.startsWith("### ")) {
      nodes.push(
        <h3 key={index} className="mt-6 text-xl font-semibold text-white">
          {line.replace("### ", "")}
        </h3>,
      );
      return;
    }

    if (line.startsWith("- ")) {
      nodes.push(
        <p key={index} className="flex items-start gap-3 pl-1 text-sm leading-7 text-white/62">
          <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff6262]" aria-hidden="true" />
          <span>{inlineCode(line.replace("- ", ""))}</span>
        </p>,
      );
      return;
    }

    if (/^\d+\.\s/.test(line)) {
      nodes.push(
        <p key={index} className="pl-4 text-sm leading-7 text-white/62">
          {inlineCode(line)}
        </p>,
      );
      return;
    }

    nodes.push(
      <p key={index} className="text-sm leading-7 text-white/62">
        {inlineCode(line)}
      </p>,
    );
  });

  return <div>{nodes}</div>;
}
