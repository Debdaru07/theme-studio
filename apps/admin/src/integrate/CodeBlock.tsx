import { useRef, useState } from 'react';

/** Copies text and announces the result in one polite live region. */
export function useCopy() {
  const [message, setMessage] = useState('');
  const timer = useRef<number>(undefined);
  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage(`Copied ${what}`);
    } catch {
      setMessage(`Could not copy ${what}. Select it and copy manually.`);
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(''), 2000);
  };
  return { copy, message };
}
export type Copy = ReturnType<typeof useCopy>['copy'];

/** Code with its file name, language and a Copy button. */
export function CodeBlock({ code, label, lang, copy }: { code: string; label: string; lang: string; copy: Copy }) {
  return (
    <figure className="int-code">
      <figcaption>
        <span className="int-code-file">{label}</span>
        <span className="int-code-lang">{lang}</span>
        <button type="button" className="btn ghost small" onClick={() => copy(code, label)}>
          Copy
        </button>
      </figcaption>
      <pre tabIndex={0} aria-label={label}>
        <code>{code}</code>
      </pre>
    </figure>
  );
}
