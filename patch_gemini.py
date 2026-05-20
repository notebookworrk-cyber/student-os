#!/usr/bin/env python3
"""
Student OS — Gemini API Patcher
================================
Run this script in the same folder as your index.html:
    python3 patch_gemini.py

It patches Student OS to use Google Gemini (FREE) instead of Anthropic.
Get your free Gemini API key at: https://aistudio.google.com/apikey
"""

import os, shutil

SOURCE = "index.html"
BACKUP = "index.html.backup"

if not os.path.exists(SOURCE):
    print("ERROR: index.html not found. Run this script in the same folder as index.html")
    exit(1)

shutil.copy(SOURCE, BACKUP)
print(f"Backup created: {BACKUP}")

with open(SOURCE, "r", encoding="utf-8") as f:
    html = f.read()

changes = 0

# 1. API check in sendAI (Anthropic key format → any key)
old1 = "if(apiKey&&apiKey.startsWith('sk-ant-')){"
new1 = "if(apiKey&&apiKey.length>10){"
if old1 in html:
    html = html.replace(old1, new1, 1)
    changes += 1
    print("✓ Change 1: sendAI key check updated")
else:
    print("⚠ Change 1 not found (may already be patched)")

# 2. Anthropic fetch → Gemini fetch
old2 = """      const res=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'x-api-key':apiKey,
          'anthropic-version':'2023-06-01',
          'anthropic-dangerous-direct-browser-access':'true'
        },
        body:JSON.stringify({
          model:'claude-haiku-4-5-20251001',
          max_tokens:600,
          system:`You are a sharp, no-nonsense AI study coach inside Student OS, a productivity app for Indian students preparing for board exams. The user's name is ${S.name}, they are Level ${S.level} with ${S.xp} XP.

Rules:
- Keep answers concise and exam-focused (under 200 words)
- Use **bold** for key terms
- Use line breaks for clarity
- Be direct, slightly brutal — no fluff
- If it's a concept question, give the core idea + one real-world example + exam tip
- If it's motivational, be honest and push them`,
          messages:aiChatHistory.slice(-10)  // last 10 messages for context
        })
      });
      te.remove();
      if(!res.ok){
        const err=await res.json().catch(()=>({}));
        if(res.status===401)throw new Error('invalid_key');
        if(res.status===429)throw new Error('rate_limit');
        throw new Error('api_error');
      }
      const data=await res.json();
      const reply=data.content?.[0]?.text||'No response received.';"""

new2 = """      const res=await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key='+apiKey,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          contents:[
            {role:'user',parts:[{text:`You are a sharp, no-nonsense AI study coach inside Student OS for Indian board exam students. Name: ${S.name}, Level: ${S.level}, XP: ${S.xp}. Keep answers concise (under 200 words), use **bold** for key terms, be direct and exam-focused.`}]},
            ...aiChatHistory.slice(-10).map(m=>({
              role:m.role==='assistant'?'model':'user',
              parts:[{text:m.content}]
            }))
          ],
          generationConfig:{maxOutputTokens:600}
        })
      });
      te.remove();
      if(!res.ok){
        const err=await res.json().catch(()=>({}));
        if(res.status===400)throw new Error('invalid_key');
        if(res.status===429)throw new Error('rate_limit');
        throw new Error('api_error');
      }
      const data=await res.json();
      const reply=data.candidates?.[0]?.content?.parts?.[0]?.text||'No response received.';"""

if old2 in html:
    html = html.replace(old2, new2, 1)
    changes += 1
    print("✓ Change 2: Anthropic fetch → Gemini fetch")
else:
    print("⚠ Change 2 not found (check manually)")

# 3. Error message
old3 = "addAIMsg('**API key invalid.** Go to Settings \u2192 AI API Key and paste a valid `sk-ant-...` key from [console.anthropic.com](https://console.anthropic.com).');"
new3 = "addAIMsg('**API key invalid.** Go to Settings \u2192 AI API Key and paste a valid Gemini key from [aistudio.google.com](https://aistudio.google.com).');"
if old3 in html:
    html = html.replace(old3, new3)
    changes += 1
    print("✓ Change 3: Error message updated")
else:
    print("⚠ Change 3 not found")

# 4. saveApiKey validation
old4 = "if(v&&v.startsWith('sk-ant-')){"
new4 = "if(v&&v.length>10){"
if old4 in html:
    html = html.replace(old4, new4)
    changes += 1
    print("✓ Change 4: saveApiKey validation updated")
else:
    print("⚠ Change 4 not found")

# 5. hasKey boot check
old5 = "const hasKey=S.settings.apiKey&&S.settings.apiKey.startsWith('sk-ant-');"
new5 = "const hasKey=S.settings.apiKey&&S.settings.apiKey.length>10;"
if old5 in html:
    html = html.replace(old5, new5)
    changes += 1
    print("✓ Change 5: Boot hasKey check updated")
else:
    print("⚠ Change 5 not found")

# 6. Placeholder
old6 = 'placeholder="sk-ant-api03-..."'
new6 = 'placeholder="AIzaSy..."'
if old6 in html:
    html = html.replace(old6, new6)
    changes += 1
    print("✓ Change 6: Input placeholder updated")
else:
    print("⚠ Change 6 not found")

# 7. Settings description
old7 = 'Add your <a href="https://console.anthropic.com" target="_blank" style="color:var(--purple)">Anthropic API key</a> to unlock real Claude AI. Without it, local answers are used.'
new7 = 'Add your <a href="https://aistudio.google.com/apikey" target="_blank" style="color:var(--purple)">Gemini API key</a> (free!) to unlock real AI. Without it, local answers are used.'
if old7 in html:
    html = html.replace(old7, new7)
    changes += 1
    print("✓ Change 7: Settings description updated")
else:
    print("⚠ Change 7 not found")

with open(SOURCE, "w", encoding="utf-8") as f:
    f.write(html)

print(f"\n{'='*40}")
print(f"Done! {changes}/7 changes applied.")
if changes == 7:
    print("All changes successful! ✓")
else:
    print("Some changes may need manual application.")
print("\nNext steps:")
print("1. Get free Gemini key: https://aistudio.google.com/apikey")
print("2. Open your Student OS app")
print("3. Go to Settings → AI API Key")
print("4. Paste your AIzaSy... key and click Save")
print("5. AI Help tab now uses real Gemini AI!")
