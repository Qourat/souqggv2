'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Category {
  id: number;
  slug: string;
  name: string;
}

interface UploadedFile {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  version: string;
}

export default function SubmitProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    price_cents: 0,
    pricing_type: 'one_time',
    category_id: '',
    product_type: 'code',
    license_type: 'standard',
    tags: '',
    demo_url: '',
    screenshot_url: '',
    file_url: '',
    version: '1.0',
    changelog: '',
    status: 'draft',
  });

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    if (file.size > 100 * 1024 * 1024) {
      setError('File too large (max 100MB)');
      return null;
    }

    setUploadProgress(10);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('version', form.version);
    formData.append('changelog', form.changelog || 'Initial upload');

    try {
      setUploadProgress(30);
      const res = await fetch('/api/upload/local', {
        method: 'POST',
        body: formData,
      });

      setUploadProgress(70);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Upload failed');
        return null;
      }

      setUploadProgress(100);
      setUploadedFiles(prev => [...prev, {
        fileUrl: data.fileUrl,
        fileName: file.name,
        fileSize: file.size,
        version: form.version,
      }]);

      return data;
    } catch (err: any) {
      setError(err.message || 'Upload error');
      return null;
    }
  }, [form.version, form.changelog]);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await uploadFile(file);
  };

  const removeFile = (idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...form,
        price_cents: Math.round(parseFloat(String(form.price_cents)) * 100) || 0,
        category_id: form.category_id ? parseInt(form.category_id) : null,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        file_url: uploadedFiles.length > 0 ? uploadedFiles[0].fileUrl : form.file_url || null,
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create product');
        return;
      }

      setSuccess(`Product "${data.product.title}" created! Redirecting...`);
      setTimeout(() => router.push(`/products/${data.product.slug}`), 1500);
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full px-2 py-1.5 border border-souq-border rounded text-sm focus:outline-none focus:border-souq-terra";
  const labelCls = "block text-sm font-medium text-souq-text mb-0.5";
  const selectCls = "w-full px-2 py-1.5 border border-souq-border rounded text-sm focus:outline-none focus:border-souq-terra bg-souq-card";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-lg font-bold mb-1">Submit a Product</h1>
      <p className="text-xs text-souq-muted mb-4">List your digital product on SOUQ.GG</p>

      {error && <div className="mb-3 p-2 bg-souq-error-bg border border-dashed border-souq-border text-souq-error-text text-sm rounded">{error}</div>}
      {success && <div className="mb-3 p-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Title */}
        <div>
          <label className={labelCls}>Title *</label>
          <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
            className={inputCls} placeholder="My Awesome Tool" />
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Description *</label>
          <textarea required rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})}
            className={inputCls} placeholder="What does it do? Who is it for?" />
        </div>

        {/* Price + Type Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Price ($) *</label>
            <input type="number" min="0" step="0.01" value={form.price_cents || ''} 
              onChange={e => setForm({...form, price_cents: parseFloat(e.target.value) || 0})}
              className={inputCls} placeholder="0 = free" />
            <span className="text-xs text-souq-faint">0 = free product</span>
          </div>
          <div>
            <label className={labelCls}>Pricing</label>
            <select value={form.pricing_type} onChange={e => setForm({...form, pricing_type: e.target.value})} className={selectCls}>
              <option value="one_time">One-time</option>
              <option value="subscription">Subscription</option>
              <option value="pay_what_you_want">Pay what you want</option>
              <option value="free">Free</option>
            </select>
          </div>
        </div>

        {/* Category + Product Type */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Category</label>
            <select value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} className={selectCls}>
              <option value="">— Select —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Product Type</label>
            <select value={form.product_type} onChange={e => setForm({...form, product_type: e.target.value})} className={selectCls}>
              <option value="code">Code / Script</option>
              <option value="template">Template</option>
              <option value="course">Course / Tutorial</option>
              <option value="design">Design Asset</option>
              <option value="ebook">Ebook / PDF</option>
              <option value="api">API / Service</option>
              <option value="tool">CLI Tool</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* License */}
        <div>
          <label className={labelCls}>License</label>
          <select value={form.license_type} onChange={e => setForm({...form, license_type: e.target.value})} className={selectCls}>
            <option value="standard">Standard</option>
            <option value="personal">Personal Use</option>
            <option value="commercial">Commercial Use</option>
            <option value="mit">MIT</option>
            <option value="gpl">GPL</option>
            <option value="apache">Apache 2.0</option>
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className={labelCls}>Tags</label>
          <input type="text" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})}
            className={inputCls} placeholder="ai, automation, python" />
          <span className="text-xs text-souq-faint">Comma-separated</span>
        </div>

        {/* FILE UPLOAD */}
        <div className="border-t pt-3">
          <label className={labelCls + ' mb-2'}>Product File</label>
          
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded p-6 text-center transition-colors ${
              dragOver ? 'border-souq-terra bg-souq-card' : 'border-souq-border bg-souq-raised hover:border-souq-muted'
            }`}
          >
            <div className="text-2xl mb-1">📦</div>
            <p className="text-sm text-souq-muted mb-2">Drag & drop your file here, or</p>
            <label className="inline-block px-3 py-1.5 bg-souq-terra text-white text-sm rounded cursor-pointer hover:bg-souq-terra-hover">
              Browse Files
              <input type="file" className="hidden" onChange={handleFileInput} 
                accept=".zip,.tar.gz,.tgz,.pdf,.js,.ts,.py,.md,.json,.png,.jpg,.webp,.svg" />
            </label>
            <p className="text-xs text-souq-faint mt-1">Max 100MB — zip, pdf, code, images</p>
          </div>

          {/* Upload progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-2">
              <div className="w-full bg-souq-line rounded-full h-1.5">
                <div className="bg-souq-terra rounded-full h-1.5 transition-all" style={{width: `${uploadProgress}%`}} />
              </div>
              <p className="text-xs text-souq-muted mt-0.5">Uploading... {uploadProgress}%</p>
            </div>
          )}

          {/* Uploaded files list */}
          {uploadedFiles.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {uploadedFiles.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-souq-raised border rounded px-3 py-2 text-sm">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-souq-text truncate block">{f.fileName}</span>
                    <span className="text-xs text-souq-faint">{(f.fileSize / 1024).toFixed(1)} KB · v{f.version}</span>
                  </div>
                  <button type="button" onClick={() => removeFile(i)} 
                    className="text-souq-terra hover:text-souq-terra-hover text-sm ml-2">✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Or paste a URL */}
          {uploadedFiles.length === 0 && (
            <div className="mt-2">
              <label className="text-xs text-souq-muted">Or paste a file URL:</label>
              <input type="url" value={form.file_url} onChange={e => setForm({...form, file_url: e.target.value})}
                className={inputCls} placeholder="https://..." />
            </div>
          )}
        </div>

        {/* Version + Changelog */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Version</label>
            <input type="text" value={form.version} onChange={e => setForm({...form, version: e.target.value})}
              className={inputCls} placeholder="1.0" />
          </div>
          <div>
            <label className={labelCls}>Changelog</label>
            <input type="text" value={form.changelog} onChange={e => setForm({...form, changelog: e.target.value})}
              className={inputCls} placeholder="Initial release" />
          </div>
        </div>

        {/* Demo + Screenshot URLs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Demo URL</label>
            <input type="url" value={form.demo_url} onChange={e => setForm({...form, demo_url: e.target.value})}
              className={inputCls} placeholder="https://demo.example.com" />
          </div>
          <div>
            <label className={labelCls}>Screenshot URL</label>
            <input type="url" value={form.screenshot_url} onChange={e => setForm({...form, screenshot_url: e.target.value})}
              className={inputCls} placeholder="https://img.example.com" />
          </div>
        </div>

        {/* Status */}
        <div>
          <label className={labelCls}>Status</label>
          <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className={selectCls}>
            <option value="draft">Draft (not visible)</option>
            <option value="active">Active (published)</option>
          </select>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button type="submit" disabled={loading}
            className="w-full py-2 bg-souq-terra text-white font-medium rounded hover:bg-souq-terra-hover disabled:opacity-50 disabled:cursor-not-allowed text-sm">
            {loading ? 'Creating...' : 'Submit Product'}
          </button>
        </div>
      </form>
    </div>
  );
}