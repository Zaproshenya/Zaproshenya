'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db, storage } from '@/lib/firebase/config';
import { ref, set, onValue, off } from 'firebase/database';
import { ref as sRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Icon } from '@/components/Icon';
import { toast } from '@/components/Toast';

export default function AdminPublisher() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'publish' | 'settings' | 'guides'>('publish');

  // ── Form States ──
  const [contentType, setContentType] = useState<'post' | 'short_video' | 'long_video'>('short_video');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaUrl] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [hashtags, setHashtags] = useState('');

  // Platforms Config
  const [platforms, setPlatforms] = useState({
    instagram_post: { enabled: false },
    instagram_reels: { enabled: false },
    facebook_post: { enabled: false },
    facebook_reels: { enabled: false },
    youtube_shorts: { enabled: false, title: '', privacy: 'public' },
    youtube_video: { enabled: false, title: '', privacy: 'public' },
    tiktok_video: { enabled: false, privacy: 'PUBLIC_TO_EVERYONE', allow_comment: true, allow_duet: true, allow_stitch: true }
  });

  // Scheduling
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // AI Modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Settings Credentials
  const [settings, setSettings] = useState<any>({
    instagram: { enabled: false, businessAccountId: '', accessToken: '', pageId: '' },
    facebook: { enabled: false, pageId: '', pageAccessToken: '' },
    youtube: { enabled: false, clientId: '', clientSecret: '', refreshToken: '' },
    tiktok: { enabled: false, clientKey: '', clientSecret: '', refreshToken: '' },
    ai: { enabled: false, apiKey: '', model: 'gemini-1.5-flash' }
  });
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Publishing Job Tracker
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobData, setJobData] = useState<any>(null);
  const [startingPublish, setStartingPublish] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Settings on Mount
  useEffect(() => {
    if (!user) return;
    loadSettings();
  }, [user]);

  // Read OAuth Query Parameter success indicators
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauth = params.get('oauth');
    const oauthError = params.get('oauth_error');

    if (oauth) {
      if (oauth === 'youtube_success') {
        toast('YouTube успішно авторизовано!', 'success');
      } else if (oauth === 'tiktok_success') {
        toast('TikTok успішно авторизовано!', 'success');
      }
      window.history.replaceState({}, document.title, window.location.pathname + '?tab=publisher');
    }

    if (oauthError) {
      toast(`Помилка авторизації: ${oauthError}`, 'error');
      window.history.replaceState({}, document.title, window.location.pathname + '?tab=publisher');
    }
  }, []);

  const loadSettings = async () => {
    try {
      setSettingsLoading(true);
      const token = await user?.getIdToken();
      const res = await fetch(`/api/admin/autopost/settings?uid=${user?.uid}&token=${token}`);
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      } else {
        const err = await res.json();
        toast(err.message || 'Помилка завантаження налаштувань', 'error');
      }
    } catch (e) {
      toast('Не вдалося підключитися до сервера', 'error');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/admin/autopost/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user?.uid, token, settings })
      });

      if (res.ok) {
        toast('Налаштування збережено успішно', 'success');
        loadSettings();
      } else {
        const err = await res.json();
        toast(err.message || 'Помилка збереження', 'error');
      }
    } catch (e) {
      toast('Помилка з’єднання', 'error');
    }
  };

  // Dynamically filter active platforms checkboxes as Content Type changes
  useEffect(() => {
    const updated = { ...platforms };
    Object.keys(updated).forEach((key) => {
      (updated as any)[key].enabled = false;
    });

    if (contentType === 'post') {
      updated.instagram_post.enabled = true;
      updated.facebook_post.enabled = true;
    } else if (contentType === 'short_video') {
      updated.instagram_reels.enabled = true;
      updated.facebook_reels.enabled = true;
      updated.youtube_shorts.enabled = true;
      updated.tiktok_video.enabled = true;
    } else if (contentType === 'long_video') {
      updated.youtube_video.enabled = true;
    }

    setPlatforms(updated);
  }, [contentType]);

  // Handle File Select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) selectFile(file);
  };

  const selectFile = (file: File) => {
    setMediaFile(file);
    const url = URL.createObjectURL(file);
    setMediaUrl(url);
    if (file.type.startsWith('video/')) {
      setContentType('short_video');
    } else if (file.type.startsWith('image/')) {
      setContentType('post');
    }
  };

  // Upload to Firebase Storage helper
  const uploadToStorage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const tempPath = `temp_publisher/${user?.uid}_${Date.now()}_${file.name}`;
      const fileRef = sRef(storage, tempPath);
      const uploadTask = uploadBytesResumable(fileRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(progress);
        },
        (error) => {
          console.error(error);
          setUploadProgress(null);
          reject(new Error('Помилка завантаження файлу в сховище'));
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setUploadProgress(null);
          resolve(downloadUrl);
        }
      );
    });
  };

  // Trigger AI text generator
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    try {
      setAiLoading(true);
      const token = await user?.getIdToken();
      const res = await fetch('/api/admin/autopost/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user?.uid, token, prompt: aiPrompt.trim() })
      });

      if (res.ok) {
        const data = await res.json();
        setDescription(data.description || '');
        setHashtags(data.hashtags || '');
        setShowAiModal(false);
        setAiPrompt('');
        toast('Контент успішно згенеровано!', 'success');
      } else {
        const err = await res.json();
        toast(err.message || 'ШІ відхилив запит', 'error');
      }
    } catch (e) {
      toast('Помилка запиту до ШІ', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  // Initiate Publish Workflow
  const handlePublish = async () => {
    if (!mediaFile && contentType !== 'post') {
      toast('Будь ласка, оберіть медіафайл для публікації відео', 'error');
      return;
    }

    const anyEnabled = Object.values(platforms).some((p) => p.enabled);
    if (!anyEnabled) {
      toast('Оберіть хоча б одну платформу для публікації', 'error');
      return;
    }

    if (platforms.youtube_shorts.enabled && !platforms.youtube_shorts.title.trim()) {
      toast('Вкажіть назву відео для YouTube Shorts', 'error');
      return;
    }
    if (platforms.youtube_video.enabled && !platforms.youtube_video.title.trim()) {
      toast('Вкажіть назву для YouTube Video', 'error');
      return;
    }

    try {
      setStartingPublish(true);
      let mediaUrl = '';

      if (mediaFile) {
        toast('Завантаження медіафайлу у хмару...', 'info');
        mediaUrl = await uploadToStorage(mediaFile);
      }

      let scheduledTime: number | null = null;
      if (isScheduled) {
        if (!scheduledDate || !scheduledTime) {
          toast('Вкажіть коректну дату та час планування', 'error');
          setStartingPublish(false);
          return;
        }
        scheduledTime = new Date(`${scheduledDate}T${scheduledTime}`).getTime();
        if (scheduledTime <= Date.now()) {
          toast('Час планування має бути у майбутньому', 'error');
          setStartingPublish(false);
          return;
        }
      }

      const token = await user?.getIdToken();
      const payload = {
        uid: user?.uid,
        token,
        mediaUrl,
        description,
        hashtags,
        platforms,
        scheduledTime
      };

      const res = await fetch('/api/admin/autopost/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.scheduled) {
          toast('Публікацію успішно заплановано!', 'success');
          setMediaFile(null);
          setMediaUrl('');
          setDescription('');
          setHashtags('');
          setIsScheduled(false);
        } else {
          toast('Публікація розпочалася!', 'success');
          setActiveJobId(data.jobId);
          subscribeToJob(data.jobId);
        }
      } else {
        const err = await res.json();
        toast(err.message || 'Помилка запуску публікації', 'error');
      }
    } catch (e: any) {
      toast(e.message || 'Внутрішня помилка під час публікації', 'error');
    } finally {
      setStartingPublish(false);
    }
  };

  // Subscribe to real-time status node in Firebase RTDB
  const subscribeToJob = (jobId: string) => {
    const jobRef = ref(db, `autopost/jobs/${jobId}`);
    onValue(jobRef, (snapshot) => {
      if (snapshot.exists()) {
        setJobData(snapshot.val());
      }
    });
  };

  const closeTracker = () => {
    if (activeJobId) {
      off(ref(db, `autopost/jobs/${activeJobId}`));
    }
    setActiveJobId(null);
    setJobData(null);
  };

  // Trigger OAuth Auth redirects
  const handleOauthConnect = async (platform: 'youtube' | 'tiktok') => {
    try {
      const token = await user?.getIdToken();
      window.location.href = `/api/admin/autopost/oauth/${platform}?uid=${user?.uid}&token=${token}`;
    } catch (e) {
      toast('Не вдалося ініціювати авторизацію', 'error');
    }
  };

  return (
    <div className="publisher-container" style={{ color: 'var(--ink)' }}>
      {/* Tab Navigation with Light Theme colors */}
      <div className="tabs-header" style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        <button 
          className={`btn-tab ${activeTab === 'publish' ? 'active' : ''}`} 
          onClick={() => setActiveTab('publish')} 
          style={{ 
            padding: '8px 16px', 
            background: activeTab === 'publish' ? 'var(--warm)' : 'transparent', 
            border: activeTab === 'publish' ? '1px solid var(--border)' : '0', 
            borderRadius: '6px', 
            color: activeTab === 'publish' ? 'var(--gold)' : 'var(--muted)', 
            fontWeight: 500,
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}
        >
          <Icon name="paper-plane-tilt" size={18} /> Публікувати
        </button>
        <button 
          className={`btn-tab ${activeTab === 'settings' ? 'active' : ''}`} 
          onClick={() => setActiveTab('settings')} 
          style={{ 
            padding: '8px 16px', 
            background: activeTab === 'settings' ? 'var(--warm)' : 'transparent', 
            border: activeTab === 'settings' ? '1px solid var(--border)' : '0', 
            borderRadius: '6px', 
            color: activeTab === 'settings' ? 'var(--gold)' : 'var(--muted)', 
            fontWeight: 500,
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}
        >
          <Icon name="gear" size={18} /> Керування ключами
        </button>
        <button 
          className={`btn-tab ${activeTab === 'guides' ? 'active' : ''}`} 
          onClick={() => setActiveTab('guides')} 
          style={{ 
            padding: '8px 16px', 
            background: activeTab === 'guides' ? 'var(--warm)' : 'transparent', 
            border: activeTab === 'guides' ? '1px solid var(--border)' : '0', 
            borderRadius: '6px', 
            color: activeTab === 'guides' ? 'var(--gold)' : 'var(--muted)', 
            fontWeight: 500,
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}
        >
          <Icon name="book" size={18} /> Інструкції / Гайд
        </button>
      </div>

      {/* ── Tab 1: PUBLISH PANEL ── */}
      {activeTab === 'publish' && (
        <div className="tab-content" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
          <div className="panel-left" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Content Type Selector */}
            <div className="field-group">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '.85rem', fontWeight: 600, color: 'var(--ink)' }}>Оберіть тип контенту</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <button className={`selector-card ${contentType === 'post' ? 'active' : ''}`} onClick={() => setContentType('post')} style={{ padding: '16px', borderRadius: '12px', border: contentType === 'post' ? '1.5px solid var(--gold)' : '1px solid var(--border)', background: contentType === 'post' ? 'var(--warm)' : 'var(--card)', color: 'var(--ink)', cursor: 'pointer', textAlign: 'center', transition: 'all .2s' }}>
                  <Icon name="image" size={24} color={contentType === 'post' ? 'var(--gold)' : 'var(--muted)'} />
                  <div style={{ marginTop: '8px', fontSize: '.85rem', fontWeight: 600, color: 'var(--ink)' }}>Пост</div>
                  <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginTop: '2px' }}>Зображення + текст</div>
                </button>
                <button className={`selector-card ${contentType === 'short_video' ? 'active' : ''}`} onClick={() => setContentType('short_video')} style={{ padding: '16px', borderRadius: '12px', border: contentType === 'short_video' ? '1.5px solid var(--gold)' : '1px solid var(--border)', background: contentType === 'short_video' ? 'var(--warm)' : 'var(--card)', color: 'var(--ink)', cursor: 'pointer', textAlign: 'center', transition: 'all .2s' }}>
                  <Icon name="video" size={24} color={contentType === 'short_video' ? 'var(--green)' : 'var(--muted)'} />
                  <div style={{ marginTop: '8px', fontSize: '.85rem', fontWeight: 600, color: 'var(--ink)' }}>Reels / Shorts / TikTok</div>
                  <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginTop: '2px' }}>Вертикальне відео &lt;60с</div>
                </button>
                <button className={`selector-card ${contentType === 'long_video' ? 'active' : ''}`} onClick={() => setContentType('long_video')} style={{ padding: '16px', borderRadius: '12px', border: contentType === 'long_video' ? '1.5px solid var(--gold)' : '1px solid var(--border)', background: contentType === 'long_video' ? 'var(--warm)' : 'var(--card)', color: 'var(--ink)', cursor: 'pointer', textAlign: 'center', transition: 'all .2s' }}>
                  <Icon name="film-strip" size={24} color={contentType === 'long_video' ? 'var(--red)' : 'var(--muted)'} />
                  <div style={{ marginTop: '8px', fontSize: '.85rem', fontWeight: 600, color: 'var(--ink)' }}>YouTube Video</div>
                  <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginTop: '2px' }}>Довге / Горизонтальне</div>
                </button>
              </div>
            </div>

            {/* Drag & Drop Media Uploader with light theme styles */}
            <div className="upload-zone" onClick={() => fileInputRef.current?.click()} style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '32px', textAlign: 'center', cursor: 'pointer', background: 'var(--card)', transition: 'border-color .2s' }}>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept={contentType === 'post' ? 'image/*' : 'video/*'} style={{ display: 'none' }} />
              
              {mediaPreview ? (
                <div style={{ maxWidth: '300px', margin: '0 auto', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                  {contentType === 'post' ? (
                    <img src={mediaPreview} alt="Preview" style={{ width: '100%', borderRadius: '8px', maxHeight: '200px', objectFit: 'contain' }} />
                  ) : (
                    <video src={mediaPreview} controls style={{ width: '100%', borderRadius: '8px', maxHeight: '200px' }} />
                  )}
                  <button onClick={() => { setMediaFile(null); setMediaUrl(''); }} style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--red)', border: 0, borderRadius: '50%', width: '24px', height: '24px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="x" size={14} />
                  </button>
                </div>
              ) : (
                <div>
                  <Icon name="cloud-arrow-up" size={40} color="var(--gold)" />
                  <p style={{ marginTop: '12px', fontSize: '.9rem', color: 'var(--ink)', fontWeight: 500 }}>Перетягніть медіафайл або натисніть для вибору</p>
                  <span style={{ fontSize: '.75rem', color: 'var(--muted)', display: 'block', marginTop: '4px' }}>
                    {contentType === 'post' ? 'Підтримуються формати PNG, JPG, WEBP' : 'Рекомендовано вертикальний формат MP4, MOV'}
                  </span>
                </div>
              )}

              {uploadProgress !== null && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ height: '4px', background: 'var(--warm)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--gold)', transition: 'width .1s' }} />
                  </div>
                  <span style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '4px', display: 'block' }}>Завантаження: {uploadProgress}%</span>
                </div>
              )}
            </div>

            {/* Description & Hashtags with light theme styles */}
            <div className="field-group" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--ink)' }}>Текст опису публікації</label>
                {settings.ai?.enabled && (
                  <button className="btn-ai" onClick={() => setShowAiModal(true)} style={{ background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)', color: '#fff', border: 0, padding: '4px 10px', borderRadius: '6px', fontSize: '.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                    <Icon name="magic-wand" size={14} /> ШІ-помічник
                  </button>
                )}
              </div>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="Напишіть опис для ваших соціальних мереж..." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--ink)', resize: 'vertical', fontSize: '.9rem' }} />
            </div>

            <div className="field-group">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '.85rem', fontWeight: 600, color: 'var(--ink)' }}>Хештеги</label>
              <input type="text" value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="#запрошення #благодійність #волонтерство" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--ink)', fontSize: '.9rem' }} />
            </div>

            {/* Scheduler */}
            <div className="scheduler-section" style={{ background: 'var(--card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon name="calendar-blank" size={20} color="var(--gold)" />
                  <div>
                    <div style={{ color: 'var(--ink)', fontSize: '.85rem', fontWeight: 600 }}>Запланувати відкладений пост</div>
                    <div style={{ fontSize: '.7rem', color: 'var(--muted)' }}>Пост вийде автоматично у вибраний час</div>
                  </div>
                </div>
                <input type="checkbox" checked={isScheduled} onChange={(e) => setIsScheduled(e.target.checked)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
              </div>

              {isScheduled && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '.75rem', color: 'var(--muted)' }}>Дата</label>
                    <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--warm)', color: 'var(--ink)', fontSize: '.85rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '.75rem', color: 'var(--muted)' }}>Час</label>
                    <input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--warm)', color: 'var(--ink)', fontSize: '.85rem' }} />
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Platform Configuration with light theme styles */}
          <div className="panel-right" style={{ display: 'flex', flexDirection: 'column', gap: '20px', background: 'var(--card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
            <h3 style={{ margin: 0, color: 'var(--ink)', fontSize: '1rem', fontWeight: 600 }}>Платформи публікації</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Instagram Card */}
              {(contentType === 'post' || contentType === 'short_video') && (
                <div className="platform-card" style={{ padding: '12px', borderRadius: '10px', background: 'var(--warm)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon name="instagram-logo" size={22} color="#e1306c" />
                      <span style={{ color: 'var(--ink)', fontSize: '.85rem', fontWeight: 600 }}>Instagram</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={contentType === 'post' ? platforms.instagram_post.enabled : platforms.instagram_reels.enabled} 
                      onChange={(e) => {
                        const key = contentType === 'post' ? 'instagram_post' : 'instagram_reels';
                        setPlatforms({ ...platforms, [key]: { ...platforms[key], enabled: e.target.checked } });
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                  <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginTop: '4px' }}>
                    Формат: {contentType === 'post' ? 'Instagram Post' : 'Instagram Reels'}
                  </div>
                </div>
              )}

              {/* Facebook Card */}
              {(contentType === 'post' || contentType === 'short_video') && (
                <div className="platform-card" style={{ padding: '12px', borderRadius: '10px', background: 'var(--warm)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon name="facebook-logo" size={22} color="#1877f2" />
                      <span style={{ color: 'var(--ink)', fontSize: '.85rem', fontWeight: 600 }}>Facebook</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={contentType === 'post' ? platforms.facebook_post.enabled : platforms.facebook_reels.enabled} 
                      onChange={(e) => {
                        const key = contentType === 'post' ? 'facebook_post' : 'facebook_reels';
                        setPlatforms({ ...platforms, [key]: { ...platforms[key], enabled: e.target.checked } });
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                  <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginTop: '4px' }}>
                    Формат: {contentType === 'post' ? 'Facebook Post' : 'Facebook Reels'}
                  </div>
                </div>
              )}

              {/* YouTube Shorts Card */}
              {contentType === 'short_video' && (
                <div className="platform-card" style={{ padding: '12px', borderRadius: '10px', background: 'var(--warm)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon name="youtube-logo" size={22} color="#ff0000" />
                      <span style={{ color: 'var(--ink)', fontSize: '.85rem', fontWeight: 600 }}>YouTube Shorts</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={platforms.youtube_shorts.enabled} 
                      onChange={(e) => setPlatforms({ ...platforms, youtube_shorts: { ...platforms.youtube_shorts, enabled: e.target.checked } })}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                  {platforms.youtube_shorts.enabled && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="Назва Shorts (обов'язково)" 
                        value={platforms.youtube_shorts.title} 
                        onChange={(e) => setPlatforms({ ...platforms, youtube_shorts: { ...platforms.youtube_shorts, title: e.target.value } })}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--ink)', fontSize: '.75rem' }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* YouTube Long Video Card */}
              {contentType === 'long_video' && (
                <div className="platform-card" style={{ padding: '12px', borderRadius: '10px', background: 'var(--warm)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon name="youtube-logo" size={22} color="#ff0000" />
                      <span style={{ color: 'var(--ink)', fontSize: '.85rem', fontWeight: 600 }}>YouTube Video</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={platforms.youtube_video.enabled} 
                      onChange={(e) => setPlatforms({ ...platforms, youtube_video: { ...platforms.youtube_video, enabled: e.target.checked } })}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                  {platforms.youtube_video.enabled && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="Назва відео (обов'язково)" 
                        value={platforms.youtube_video.title} 
                        onChange={(e) => setPlatforms({ ...platforms, youtube_video: { ...platforms.youtube_video, title: e.target.value } })}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--ink)', fontSize: '.75rem' }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* TikTok Card */}
              {contentType === 'short_video' && (
                <div className="platform-card" style={{ padding: '12px', borderRadius: '10px', background: 'var(--warm)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon name="tiktok-logo" size={20} color="#25f4ee" />
                      <span style={{ color: 'var(--ink)', fontSize: '.85rem', fontWeight: 600 }}>TikTok Video</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={platforms.tiktok_video.enabled} 
                      onChange={(e) => setPlatforms({ ...platforms, tiktok_video: { ...platforms.tiktok_video, enabled: e.target.checked } })}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                  {platforms.tiktok_video.enabled && (
                    <div style={{ marginTop: '10px' }}>
                      <select 
                        value={platforms.tiktok_video.privacy} 
                        onChange={(e) => setPlatforms({ ...platforms, tiktok_video: { ...platforms.tiktok_video, privacy: e.target.value } })}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--ink)', fontSize: '.75rem' }}
                      >
                        <option value="PUBLIC_TO_EVERYONE">Публічне (Всім)</option>
                        <option value="MUTUAL_FOLLOWERS_CLAN">Тільки для друзів</option>
                        <option value="SELF_ONLY">Приватне (Тільки мені)</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Glowing publication button */}
            <button 
              className="btn-glow-publish" 
              onClick={handlePublish} 
              disabled={startingPublish}
              style={{ 
                background: 'linear-gradient(135deg, var(--gold) 0%, #10b981 100%)', 
                color: '#fff', 
                border: 0, 
                padding: '14px 20px', 
                borderRadius: '10px', 
                fontWeight: 600, 
                fontSize: '.95rem', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px', 
                boxShadow: '0 4px 15px rgba(201,146,42,.2)', 
                marginTop: '12px',
                transition: 'all .2s' 
              }}
            >
              {startingPublish ? (
                <>Запуск публікації...</>
              ) : (
                <>
                  <Icon name="paper-plane-tilt" size={20} />
                  {isScheduled ? 'Запланувати публікацію' : 'Опублікувати на всіх'}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Tab 2: CREDENTIALS SETTINGS ── */}
      {activeTab === 'settings' && (
        <div className="tab-content" style={{ maxWidth: '700px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ margin: 0, color: 'var(--ink)', fontSize: '1.25rem', fontWeight: 600 }}>Налаштування секретних токенів</h2>
          <p style={{ margin: 0, fontSize: '.85rem', color: 'var(--muted)' }}>Усі введені ключі надійно шифруються на сервері алгоритмом AES-256-GCM.</p>

          {settingsLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>Завантаження конфігурації...</div>
          ) : (
            <>
              {/* Instagram & Facebook */}
              <div className="settings-card" style={{ background: 'var(--card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                <h3 style={{ margin: '0 0 16px 0', color: 'var(--ink)', fontSize: '.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Icon name="instagram-logo" size={20} color="#e1306c" /> Meta API (Instagram & Facebook)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '.75rem', color: 'var(--muted)' }}>Facebook Page ID</label>
                    <input type="text" value={settings.facebook.pageId} onChange={(e) => setSettings({ ...settings, facebook: { ...settings.facebook, pageId: e.target.value }, instagram: { ...settings.instagram, pageId: e.target.value } })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--warm)', color: 'var(--ink)', fontSize: '.85rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '.75rem', color: 'var(--muted)' }}>Facebook Page Access Token</label>
                    <input type="password" value={settings.facebook.pageAccessToken} onChange={(e) => setSettings({ ...settings, facebook: { ...settings.facebook, pageAccessToken: e.target.value } })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--warm)', color: 'var(--ink)', fontSize: '.85rem' }} />
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '.75rem', color: 'var(--muted)' }}>Instagram Business Account ID</label>
                    <input type="text" value={settings.instagram.businessAccountId} onChange={(e) => setSettings({ ...settings, instagram: { ...settings.instagram, businessAccountId: e.target.value } })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--warm)', color: 'var(--ink)', fontSize: '.85rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '.75rem', color: 'var(--muted)' }}>Instagram Access Token</label>
                    <input type="password" value={settings.instagram.accessToken} onChange={(e) => setSettings({ ...settings, instagram: { ...settings.instagram, accessToken: e.target.value } })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--warm)', color: 'var(--ink)', fontSize: '.85rem' }} />
                  </div>
                </div>
              </div>

              {/* YouTube */}
              <div className="settings-card" style={{ background: 'var(--card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, color: 'var(--ink)', fontSize: '.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon name="youtube-logo" size={20} color="#ff0000" /> YouTube Shorts & Videos
                  </h3>
                  <button className="btn-oauth-connect" onClick={() => handleOauthConnect('youtube')} style={{ background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid var(--red)', padding: '6px 12px', borderRadius: '6px', fontSize: '.75rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Icon name="google-logo" size={14} /> Авторизувати Google
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '.75rem', color: 'var(--muted)' }}>Google OAuth Client ID</label>
                    <input type="text" value={settings.youtube.clientId} onChange={(e) => setSettings({ ...settings, youtube: { ...settings.youtube, clientId: e.target.value } })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--warm)', color: 'var(--ink)', fontSize: '.85rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '.75rem', color: 'var(--muted)' }}>Google OAuth Client Secret</label>
                    <input type="password" value={settings.youtube.clientSecret} onChange={(e) => setSettings({ ...settings, youtube: { ...settings.youtube, clientSecret: e.target.value } })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--warm)', color: 'var(--ink)', fontSize: '.85rem' }} />
                  </div>
                </div>
              </div>

              {/* TikTok */}
              <div className="settings-card" style={{ background: 'var(--card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, color: 'var(--ink)', fontSize: '.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon name="tiktok-logo" size={18} color="#00f2fe" /> TikTok Content Posting API
                  </h3>
                  <button className="btn-oauth-connect" onClick={() => handleOauthConnect('tiktok')} style={{ background: 'var(--blue-bg)', color: 'var(--blue)', border: '1px solid var(--blue)', padding: '6px 12px', borderRadius: '6px', fontSize: '.75rem', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Icon name="link-simple" size={14} /> Підключити TikTok
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '.75rem', color: 'var(--muted)' }}>TikTok Client Key</label>
                    <input type="text" value={settings.tiktok.clientKey} onChange={(e) => setSettings({ ...settings, tiktok: { ...settings.tiktok, clientKey: e.target.value } })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--warm)', color: 'var(--ink)', fontSize: '.85rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '.75rem', color: 'var(--muted)' }}>TikTok Client Secret</label>
                    <input type="password" value={settings.tiktok.clientSecret} onChange={(e) => setSettings({ ...settings, tiktok: { ...settings.tiktok, clientSecret: e.target.value } })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--warm)', color: 'var(--ink)', fontSize: '.85rem' }} />
                  </div>
                </div>
              </div>

              {/* AI Gemini */}
              <div className="settings-card" style={{ background: 'var(--card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ margin: 0, color: 'var(--ink)', fontSize: '.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icon name="magic-wand" size={18} color="#a855f7" /> ШІ-Помічник (Gemini / Gemma API)
                  </h3>
                  <input type="checkbox" checked={settings.ai.enabled} onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, enabled: e.target.checked } })} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                </div>
                {settings.ai.enabled && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '.75rem', color: 'var(--muted)' }}>Gemini API Key</label>
                      <input type="password" value={settings.ai.apiKey} onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, apiKey: e.target.value } })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--warm)', color: 'var(--ink)', fontSize: '.85rem' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '.75rem', color: 'var(--muted)' }}>Модель ШІ за замовчуванням</label>
                      <input type="text" value={settings.ai.model} onChange={(e) => setSettings({ ...settings, ai: { ...settings.ai, model: e.target.value } })} placeholder="gemini-1.5-flash" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--warm)', color: 'var(--ink)', fontSize: '.85rem' }} />
                      <span style={{ fontSize: '.7rem', color: 'var(--muted)', marginTop: '4px', display: 'block' }}>Рекомендовано: gemini-1.5-flash або gemma2-27b-it для швидкої роботи</span>
                    </div>
                  </div>
                )}
              </div>

              <button onClick={handleSaveSettings} style={{ background: 'var(--green)', color: '#fff', border: 0, padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '.9rem', alignSelf: 'flex-start', boxShadow: '0 4px 12px rgba(16,185,129,.15)', transition: 'all .2s' }}>
                Зберегти налаштування
              </button>
            </>
          )}
        </div>
      )}

      {/* ── Tab 3: USER GUIDES ── */}
      {activeTab === 'guides' && (
        <div className="tab-content" style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '20px', lineHeight: 1.6 }}>
          <h2 style={{ margin: 0, color: 'var(--ink)', fontSize: '1.25rem', fontWeight: 600 }}>Інструкції з налаштування та отримання ключів</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <details style={{ background: 'var(--card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', cursor: 'pointer' }}>
              <summary style={{ color: 'var(--ink)', fontWeight: 600, fontSize: '.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="instagram-logo" size={18} color="#e1306c" /> Як отримати ключі для Instagram & Facebook
              </summary>
              <div style={{ marginTop: '12px', paddingLeft: '26px', cursor: 'default', fontSize: '.85rem', color: 'var(--ink)' }}>
                <ol style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '16px' }}>
                  <li>Перейдіть на портал <a href="https://developers.facebook.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--blue)' }}>Meta Developers</a> та створіть Business додаток.</li>
                  <li>Додайте продукти <strong>Facebook Login</strong> та <strong>Instagram Graph API</strong>.</li>
                  <li>Отримайте Never-Expiring Page Token (безстроковий токен сторінки) через Graph API Explorer з дозволами: <code>pages_show_list, pages_read_engagement, pages_manage_posts, instagram_basic, instagram_content_publish</code>.</li>
                  <li>Знайдіть ваш <strong>Facebook Page ID</strong> в налаштуваннях сторінки.</li>
                  <li>Отримайте <strong>Instagram Business Account ID</strong> через Graph Explorer або налаштування бізнес-аккаунта Instagram, зв'язаного зі сторінкою.</li>
                </ol>
              </div>
            </details>

            <details style={{ background: 'var(--card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', cursor: 'pointer' }}>
              <summary style={{ color: 'var(--ink)', fontWeight: 600, fontSize: '.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="youtube-logo" size={18} color="#ff0000" /> Як отримати OAuth Credentials для YouTube
              </summary>
              <div style={{ marginTop: '12px', paddingLeft: '26px', cursor: 'default', fontSize: '.85rem', color: 'var(--ink)' }}>
                <ol style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '16px' }}>
                  <li>Перейдіть на <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--blue)' }}>Google Cloud Console</a> та створіть новий проект.</li>
                  <li>Увімкніть бібліотеку API: <strong>YouTube Data API v3</strong>.</li>
                  <li>На сторінці OAuth Consent Screen налаштуйте екран згоди як <strong>External</strong> та обов'язково додайте ваші робочі Gmail-скриньки у список тестових користувачів.</li>
                  <li>Додайте область доступу (scope): <code>https://www.googleapis.com/auth/youtube.upload</code>.</li>
                  <li>У розділі Credentials створіть <strong>OAuth Client ID</strong> (тип: Web Application).</li>
                  <li>Додайте Authorized Redirect URI: <code>https://ваша-доменна-адреса.com/api/admin/autopost/oauth/youtube/callback</code>.</li>
                  <li>Збережіть Client ID та Client Secret у налаштуваннях ліворуч та натисніть кнопку "Авторизувати Google".</li>
                </ol>
              </div>
            </details>

            <details style={{ background: 'var(--card)', borderRadius: '12px', padding: '16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', cursor: 'pointer' }}>
              <summary style={{ color: 'var(--ink)', fontWeight: 600, fontSize: '.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="tiktok-logo" size={16} color="#00f2fe" /> Як підключити TikTok Content Posting API
              </summary>
              <div style={{ marginTop: '12px', paddingLeft: '26px', cursor: 'default', fontSize: '.85rem', color: 'var(--ink)' }}>
                <ol style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '16px' }}>
                  <li>Зареєструйтеся на <a href="https://developers.tiktok.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--blue)' }}>TikTok Developer Portal</a>.</li>
                  <li>Створіть додаток та підключіть дозвіл <strong>Content Posting API</strong> у конфігурації.</li>
                  <li>Скопіюйте Client Key та Client Secret у форми налаштувань ліворуч.</li>
                  <li>Вкажіть Authorized Redirect URI: <code>https://ваша-доменна-адреса.com/api/admin/autopost/oauth/tiktok/callback</code>.</li>
                  <li>Натисніть кнопку "Підключити TikTok" для проходження авторизації та прив'язки акаунта.</li>
                </ol>
              </div>
            </details>

          </div>
        </div>
      )}

      {/* ── AI PROMPT MODAL ── */}
      {showAiModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(24, 18, 10, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
          <div className="modal-content" style={{ background: 'var(--card)', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '500px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ margin: '0 0 12px 0', color: 'var(--ink)', fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="magic-wand" size={18} color="#a855f7" /> ШІ-помічник генерації постів
            </h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '.8rem', color: 'var(--muted)' }}>
              Вкажіть коротку тему або тези для вашого майбутнього поста. Наш штучний інтелект розпише детальний художній текст українською мовою та автоматично підбере відповідні теги.
            </p>
            <textarea 
              value={aiPrompt} 
              onChange={(e) => setAiPrompt(e.target.value)} 
              rows={4} 
              placeholder="Приклад: Напиши запрошення на благодійну зустріч з переселенцями, зустріч у суботу о 15:00, кава-брейк безкоштовний..." 
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--warm)', color: 'var(--ink)', fontSize: '.85rem', marginBottom: '16px', resize: 'none' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => { setShowAiModal(false); setAiPrompt(''); }} style={{ background: 'transparent', border: 0, color: 'var(--muted)', padding: '8px 16px', cursor: 'pointer', fontSize: '.85rem' }}>Скасувати</button>
              <button 
                onClick={handleAiGenerate} 
                disabled={aiLoading || !aiPrompt.trim()} 
                style={{ 
                  background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)', 
                  color: '#fff', 
                  border: 0, 
                  padding: '8px 16px', 
                  borderRadius: '6px', 
                  cursor: 'pointer', 
                  fontSize: '.85rem', 
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {aiLoading ? 'Генерація...' : 'Згенерувати'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LIVE PUBLISH PROGRESS OVERLAY (Tracker) ── */}
      {activeJobId && jobData && (
        <div className="tracker-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(24, 18, 10, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, backdropFilter: 'blur(6px)' }}>
          <div className="tracker-content" style={{ background: 'var(--card)', padding: '28px', borderRadius: '20px', width: '90%', maxWidth: '460px', border: '1px solid var(--border)', textAlign: 'center', boxShadow: 'var(--shadow-lg)' }}>
            
            <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'var(--green-bg)', marginBottom: '16px' }}>
              <Icon name="share-network" size={32} color="var(--green)" />
            </div>

            <h3 style={{ margin: '0 0 8px 0', color: 'var(--ink)', fontSize: '1.15rem', fontWeight: 600 }}>Іде процес автопостингу</h3>
            <p style={{ margin: '0 0 24px 0', fontSize: '.85rem', color: 'var(--muted)' }}>Пости відправляються на ваші платформи у реальному часі.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', marginBottom: '24px' }}>
              {Object.entries(jobData.platforms || {}).map(([key, details]: [string, any]) => {
                const isSuccess = details.status === 'success';
                const isFailed = details.status === 'failed';
                const isProcessing = details.status === 'processing';

                return (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', background: 'var(--warm)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {key.includes('youtube') && <Icon name="youtube-logo" size={20} color="#ff0000" />}
                      {key.includes('instagram') && <Icon name="instagram-logo" size={20} color="#e1306c" />}
                      {key.includes('facebook') && <Icon name="facebook-logo" size={20} color="#1877f2" />}
                      {key.includes('tiktok') && <Icon name="tiktok-logo" size={18} color="#1e1e24" />}
                      
                      <span style={{ color: 'var(--ink)', fontSize: '.85rem', fontWeight: 600 }}>
                        {key === 'youtube_shorts' && 'YouTube Shorts'}
                        {key === 'youtube_video' && 'YouTube Video'}
                        {key === 'instagram_post' && 'Instagram Post'}
                        {key === 'instagram_reels' && 'Instagram Reels'}
                        {key === 'facebook_post' && 'Facebook Post'}
                        {key === 'facebook_reels' && 'Facebook Reels'}
                        {key === 'tiktok_video' && 'TikTok Video'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isProcessing && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '.75rem', color: 'var(--muted)' }}>{details.message || 'Обробка...'}</span>
                          <span className="spinner-loader" style={{ width: '12px', height: '12px', border: '2px solid var(--border)', borderTopColor: 'var(--green)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        </div>
                      )}

                      {isSuccess && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '.75rem', color: 'var(--green)', fontWeight: 500 }}>{details.message || 'Опубліковано!'}</span>
                          <Icon name="check-circle" size={18} color="var(--green)" />
                          {details.url && (
                            <a href={details.url} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)', display: 'inline-flex', marginLeft: '4px' }}>
                              <Icon name="arrow-square-out" size={14} />
                            </a>
                          )}
                        </div>
                      )}

                      {isFailed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '.75rem', color: 'var(--red)', fontWeight: 500 }} title={details.error}>{details.error || 'Помилка'}</span>
                          <Icon name="x-circle" size={18} color="var(--red)" />
                        </div>
                      )}

                      {details.status === 'pending' && (
                        <span style={{ fontSize: '.75rem', color: 'var(--muted)' }}>У черзі...</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <style jsx global>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>

            <button 
              onClick={closeTracker} 
              style={{ 
                background: jobData.status === 'completed' ? 'var(--green)' : 'var(--warm)', 
                color: jobData.status === 'completed' ? '#fff' : 'var(--ink)', 
                border: jobData.status === 'completed' ? 0 : '1px solid var(--border)', 
                padding: '10px 24px', 
                borderRadius: '8px', 
                fontSize: '.85rem', 
                fontWeight: 600, 
                cursor: 'pointer',
                transition: 'all .2s'
              }}
            >
              {jobData.status === 'completed' ? 'Закрити (Готово)' : 'Закрити вікно відстеження'}
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
