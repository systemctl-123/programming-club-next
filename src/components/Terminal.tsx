'use client';

import React, { useEffect, useState, useRef } from 'react';

interface Token {
  t: string; // token type (e.g. kw, tc, fn, num, cm)
  v: string; // token value
}

interface TermLine {
  tokens: Token[];
}

const TERM_LINES: TermLine[] = [
  { tokens: [{ t: 'cm', v: '# ML Workshop — Image Classifier' }] },
  { tokens: [{ t: 'kw', v: 'import ' }, { t: 'tc', v: 'torch' }] },
  { tokens: [{ t: 'kw', v: 'import ' }, { t: 'tc', v: 'torch.nn ' }, { t: 'kw', v: 'as ' }, { t: 'tc', v: 'nn' }] },
  { tokens: [{ t: 'kw', v: 'from ' }, { t: 'tc', v: 'torchvision' }, { t: 'kw', v: ' import ' }, { t: 'tc', v: 'models' }]},
  { tokens: [{ t: 'kw', v: 'from ' }, { t: 'tc', v: 'pcstat' }, { t: 'kw', v: ' import ' }, { t: 'tc', v: 'train' }]},
  { tokens: [] }, // empty line
  { tokens: [{ t: 'fn', v: 'model' }, { t: 'tc', v: ' = models.' }, { t: 'fn', v: 'resnet18' }, { t: 'tc', v: '(\u200B' }, { t: 'tc', v: 'pretrained=' }, { t: 'kw', v: 'True' }, { t: 'tc', v: ')' }] },
  { tokens: [{ t: 'fn', v: 'optimizer' }, { t: 'tc', v: ' = torch.optim.' }, { t: 'fn', v: 'Adam' }, { t: 'tc', v: '(\u200B' }, { t: 'tc', v: 'model.parameters(), lr=' }, { t: 'num', v: '1e-4' }, { t: 'tc', v: ')' }] },
  { tokens: [] }, // empty line
  { tokens: [{ t: 'fn', v: 'train' }, { t: 'tc', v: '(model, epochs=' }, { t: 'num', v: '10' }, { t: 'tc', v: ')' }] },
  { tokens: [] }, // empty line
];

export default function Terminal() {
  const [renderedLines, setRenderedLines] = useState<React.ReactNode[]>([]);
  const [showChart, setShowChart] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    async function runAnimation() {
      // 1. Type the code lines
      for (let lineIdx = 0; lineIdx < TERM_LINES.length; lineIdx++) {
        if (!active) return;
        const line = TERM_LINES[lineIdx];

        if (line.tokens.length === 0) {
          setRenderedLines(prev => [...prev, <div key={`empty-${lineIdx}`}>&nbsp;</div>]);
          await new Promise(r => setTimeout(r, 100));
          continue;
        }

        // Add an empty active line that we will fill
        const tokenElements: React.ReactNode[] = [];
        setRenderedLines(prev => [...prev, <div key={`line-${lineIdx}`} className="tl">{tokenElements}</div>]);

        for (let tokIdx = 0; tokIdx < line.tokens.length; tokIdx++) {
          if (!active) return;
          const token = line.tokens[tokIdx];

          // Fill token character by character
          let typedText = '';
          for (let charIdx = 0; charIdx < token.v.length; charIdx++) {
            if (!active) return;
            typedText += token.v[charIdx];

            // Update the last line's tokens in state
            const currentTypedText = typedText;
            setRenderedLines(prev => {
              const updated = [...prev];
              const lineTokens = [...(updated[updated.length - 1] as React.ReactElement).props.children];
              lineTokens[tokIdx] = (
                <span key={`tok-${tokIdx}`} className={`t-${token.t}`}>
                  {currentTypedText}
                </span>
              );
              updated[updated.length - 1] = (
                <div key={`line-${lineIdx}`} className="tl">
                  {lineTokens}
                </div>
              );
              return updated;
            });

            await new Promise(r => setTimeout(r, 20));
          }
        }
        await new Promise(r => setTimeout(r, 150));
        if (bodyRef.current) {
          bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
        }
      }

      // 2. Pause
      await new Promise(r => setTimeout(r, 600));
      if (!active) return;

      // 3. Show training complete
      setRenderedLines(prev => [
        ...prev,
        <div key="complete" className="tl">
          <span className="to">❯ Training complete. Results:</span>
        </div>
      ]);
      await new Promise(r => setTimeout(r, 300));
      if (!active) return;

      // 4. Trigger charts animation
      setShowChart(true);
      await new Promise(r => setTimeout(r, 500));
      if (!active) return;

      // 5. Show final command prompt
      setShowComplete(true);
    }

    runAnimation();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [renderedLines, showChart, showComplete]);

  return (
    <div className="term">
      <div className="tbar">
        <div className="dot dr"></div>
        <div className="dot dy"></div>
        <div className="dot dg"></div>
        <span className="tttl">programming_club/train_model.py</span>
      </div>
      <div className="tbody" id="term-body" ref={bodyRef}>
        {renderedLines}

        {showChart && (
          <div className="t-chart">
            <div className="t-bar-row">
              <span className="t-bar-lbl">Train Acc</span>
              <div className="t-bar-track">
                <div className="t-bar-fill f1" style={{ width: '92.4%' }}></div>
              </div>
              <span className="t-bar-val">92.4%</span>
            </div>
            <div className="t-bar-row">
              <span className="t-bar-lbl">Val Acc</span>
              <div className="t-bar-track">
                <div className="t-bar-fill f2" style={{ width: '78.1%' }}></div>
              </div>
              <span className="t-bar-val">78.1%</span>
            </div>
            <div className="t-bar-row">
              <span className="t-bar-lbl">F1 Score</span>
              <div className="t-bar-track">
                <div className="t-bar-fill f3" style={{ width: '85.1%' }}></div>
              </div>
              <span className="t-bar-val">0.851</span>
            </div>
            <div className="t-bar-row">
              <span className="t-bar-lbl">Loss</span>
              <div className="t-bar-track">
                <div className="t-bar-fill f4" style={{ width: '61.2%' }}></div>
              </div>
              <span className="t-bar-val">0.612</span>
            </div>
          </div>
        )}

        {showComplete && (
          <>
            <div>&nbsp;</div>
            <div className="tl">
              <span className="tp">❯❯❯ </span>
              <span className="tcur"></span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
