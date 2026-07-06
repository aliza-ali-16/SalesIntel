const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const htmlToDocx = require('html-to-docx');
const mdPath = path.join(__dirname, '..', 'documentation.md');
const docxPath = path.join(__dirname, '..', 'documentation.docx');
async function main() {
    console.log('📖 Reading documentation.md...');
    if (!fs.existsSync(mdPath)) {
        throw new Error(`documentation.md not found at ${mdPath}`);
    }
    let md = fs.readFileSync(mdPath, 'utf8');
    // Replace Mermaid blocks with clean, styled visual representations for Word Document
    md = md.replace(/```mermaid([\s\S]*?)```/g, (match, code) => {
        // Standardize indent lines
        const lines = code.trim().split('\n').map(l => l.trim()).filter(l => l);
        let output = '\n> **[VISUAL FLOW DIAGRAM SCHEMATIC]**\n>\n';
        lines.forEach(line => {
            // Map common mermaid arrow/node definitions to a simplified text layout
            let formattedLine = line
                .replace(/-->/g, ' ➔ ')
                .replace(/==>/g, ' ➔ ')
                .replace(/-\.->/g, ' ➔ ')
                .replace(/\|/g, ': ')
                .replace(/\[/g, ' [')
                .replace(/\]/g, '] ')
                .replace(/\(/g, ' (')
                .replace(/\)/g, ') ')
                .replace(/\{/g, ' {')
                .replace(/\}/g, '} ');
            output += `> • ${formattedLine}\n`;
        });
        return output + '\n';
    });
    console.log('⚡ Parsing markdown to HTML structure...');
    const bodyHtml = marked.parse(md);
    // Structured wrapper with clean formatting settings suitable for conversion to docx
    const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>AI Sales Intelligence Multi-Agent System - Technical Specification</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          font-size: 11pt;
          line-height: 1.5;
          color: #1e293b;
        }
        h1 {
          font-family: 'Arial', sans-serif;
          font-size: 18pt;
          color: #7c3aed;
          margin-top: 24pt;
          margin-bottom: 12pt;
          border-bottom: 2px solid #7c3aed;
          padding-bottom: 4pt;
        }
        h2 {
          font-family: 'Arial', sans-serif;
          font-size: 14pt;
          color: #6366f1;
          margin-top: 18pt;
          margin-bottom: 8pt;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 3pt;
        }
        h3 {
          font-family: 'Arial', sans-serif;
          font-size: 12pt;
          color: #8b5cf6;
          margin-top: 14pt;
          margin-bottom: 6pt;
        }
        p {
          margin-bottom: 10pt;
          text-align: justify;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12pt;
          margin-bottom: 12pt;
        }
        th, td {
          border: 1px solid #cbd5e1;
          padding: 8px;
          font-size: 10pt;
          vertical-align: top;
        }
        th {
          background-color: #f8fafc;
          color: #0f172a;
          font-weight: bold;
          text-align: left;
        }
        blockquote {
          margin-left: 0;
          margin-right: 0;
          padding: 10px 15px;
          background-color: #f8fafc;
          border-left: 4px solid #8b5cf6;
          color: #475569;
          font-style: italic;
        }
        ul, ol {
          margin-top: 0;
          margin-bottom: 10pt;
          padding-left: 20px;
        }
        li {
          margin-bottom: 4pt;
        }
        code {
          font-family: 'Courier New', Courier, monospace;
          font-size: 9.5pt;
          background-color: #f1f5f9;
          padding: 2px 4px;
        }
        pre {
          font-family: 'Courier New', Courier, monospace;
          font-size: 9.5pt;
          background-color: #f1f5f9;
          padding: 12px;
          margin-top: 10pt;
          margin-bottom: 10pt;
          border-radius: 4px;
          white-space: pre-wrap;
        }
      </style>
    </head>
    <body>
      ${bodyHtml}
    </body>
    </html>
  `;
    console.log('🔄 Compiling HTML to Word file buffer...');
    // margins in twentieths of a point (dxa). 1440 dxa = 1 inch
    const options = {
        orientation: 'portrait',
        margins: {
            top: 1440,
            right: 1440,
            bottom: 1440,
            left: 1440
        },
        table: { row: { cantSplit: true } },
        footer: true,
        header: true,
        pageNumber: true
    };
    const docxBuffer = await htmlToDocx(fullHtml, null, options);
    console.log('💾 Saving Word document...');
    fs.writeFileSync(docxPath, docxBuffer);
    console.log(`🚀 Success! Word document generated at: ${docxPath}`);
}
main().catch(err => {
    console.error('❌ Error compiling Word document:', err);
    process.exit(1);
});
