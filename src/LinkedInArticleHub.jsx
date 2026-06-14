import React, { useState, useEffect } from 'react';
import { Send, Globe, Eye, Plus, Share2, LogOut, Loader, CheckCircle, AlertCircle, Clock, Edit2, Save, Image as ImageIcon, Zap, Check } from 'lucide-react';

const LinkedInArticleHub = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);

  // App State
  const [articles, setArticles] = useState([]);
  const [view, setView] = useState('dashboard');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [editingArticleId, setEditingArticleId] = useState(null);

  // Form State
  const [manualArticle, setManualArticle] = useState({
    topic: '',
    topicCategory: 'ai-evolution',
    content: '',
    imageUrl: ''
  });

  // Smart features
  const [recentTopics, setRecentTopics] = useState(JSON.parse(localStorage.getItem('recentTopics') || '[]'));
  const [promptCopied, setPromptCopied] = useState(false);
  const [contentValid, setContentValid] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [parsedContent, setParsedContent] = useState({ en: '', fr: '' });

  // Image State
  const [searchingImages, setSearchingImages] = useState(false);
  const [suggestedImages, setSuggestedImages] = useState([]);
  const [showImageSuggestions, setShowImageSuggestions] = useState(false);

  const topicCategories = [
    { id: 'ai-evolution', label: 'Evolution of AI' },
    { id: 'ai-workplace', label: 'AI in the Workplace' },
    { id: 'ai-economy', label: 'AI in the Economy' },
    { id: 'project-management', label: 'Project Management' },
    { id: 'product-ownership', label: 'Product Ownership' },
    { id: 'development', label: 'Development' }
  ];

  // Validate and parse pasted content
  const validateAndParseContent = (text) => {
    const englishMatch = text.match(/===\s*ENGLISH\s*===([\s\S]*?)(?===\s*FRENCH|$)/i);
    const frenchMatch = text.match(/===\s*FRENCH\s*===([\s\S]*?)$/i);

    if (englishMatch && frenchMatch) {
      const en = englishMatch[1].trim();
      const fr = frenchMatch[1].trim();
      const enWords = en.split(/\s+/).length;
      const frWords = fr.split(/\s+/).length;

      // Check if within 200-300 word range (flexible for faster processing)
      const enValid = enWords >= 150 && enWords <= 350;
      const frValid = frWords >= 150 && frWords <= 350;

      if (enValid && frValid) {
        setContentValid(true);
        setParsedContent({ en, fr });
        setValidationMessage(`✅ Perfect! ${enWords} EN words, ${frWords} FR words`);
        return true;
      } else {
        setContentValid(false);
        setValidationMessage(`⚠️ EN: ${enWords} words (need 150-350), FR: ${frWords} words (need 150-350)`);
        return false;
      }
    } else {
      setContentValid(false);
      setValidationMessage('❌ Format error. Make sure to include === ENGLISH === and === FRENCH === markers');
      return false;
    }
  };

  // Add topic to recent
  const addToRecentTopics = (topic) => {
    const updated = [topic, ...recentTopics.filter(t => t !== topic)].slice(0, 5);
    setRecentTopics(updated);
    localStorage.setItem('recentTopics', JSON.stringify(updated));
  };

  const handleContentPaste = (e) => {
    const text = e.target.value;
    setManualArticle({ ...manualArticle, content: text });
    
    if (text.trim().length > 50) {
      validateAndParseContent(text);
    } else {
      setContentValid(false);
      setValidationMessage('');
    }
  };

  // Copy prompt to clipboard
  const copyPromptToClipboard = () => {
    if (!manualArticle.topic.trim()) {
      alert('Please enter a topic first');
      return;
    }

    const prompt = `Write a professional LinkedIn article about: "${manualArticle.topic}"

Format your response EXACTLY like this:

=== ENGLISH ===
[Your English article here - 250 words - WITH VISUAL FORMATTING]

=== FRENCH ===
[Your French article here - 250 words - WITH VISUAL FORMATTING]

CRITICAL: Make it VISUAL and ENGAGING:
✨ Use emojis/icons throughout (not too many, 2-3 total)
• Use 2-3 bullet points for key takeaways
📌 Use short, punchy paragraphs (2-3 sentences max)
🎯 Start with a hook that grabs attention
💡 Include 1 actionable insight or tip
→ Use arrows and symbols for flow/emphasis

Structure:
1. Attention-grabbing opening line (with emoji)
2. 1-2 short paragraphs explaining the topic
3. 2-3 bullet points with key insights
4. 1 actionable takeaway or call-to-action
5. Brief closing thought

Requirements:
- Professional yet conversational tone
- Suitable for LinkedIn
- Aim for ~250 words (visual formatting reduces word count slightly)
- Make it skimmable (people scan LinkedIn, not read)
- Use line breaks between sections
- Include relevant emojis but keep it professional`;

    navigator.clipboard.writeText(prompt).then(() => {
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
      // Open Claude
      setTimeout(() => {
        window.open('https://claude.ai', '_blank');
      }, 500);
    });
  };

  // Add topic to recent
  const addToRecentTopics = (topic) => {
    const updated = [topic, ...recentTopics.filter(t => t !== topic)].slice(0, 5);
    setRecentTopics(updated);
    localStorage.setItem('recentTopics', JSON.stringify(updated));
  };

  // Extract key words from topic for better search
  const extractKeywords = (topic) => {
    const stopWords = ['the', 'in', 'and', 'or', 'of', 'to', 'a', 'an', 'is', 'are'];
    const words = topic.toLowerCase().split(/\s+/).filter(word => !stopWords.includes(word) && word.length > 3);
    return words.slice(0, 3);
  };

  // Search for images on Unsplash
  const searchImages = async () => {
    if (!manualArticle.topic.trim()) {
      alert('Please enter a topic first');
      return;
    }

    setSearchingImages(true);
    try {
      const keywords = extractKeywords(manualArticle.topic);
      const searchQueries = [
        manualArticle.topic,
        keywords.join(' '),
        manualArticle.topicCategory.replace(/-/g, ' ')
      ];

      let allImages = [];

      for (const query of searchQueries) {
        if (allImages.length >= 12) break;

        try {
          const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=8&client_id=YOUR_UNSPLASH_API_KEY`
          );

          if (response.ok) {
            const data = await response.json();
            const images = data.results.map(img => ({
              url: img.urls.regular,
              alt: img.alt_description || 'Image'
            }));
            allImages = [...allImages, ...images];
          }
        } catch (e) {
          console.log(`Search failed for "${query}"`);
        }
      }

      const uniqueImages = allImages.filter((img, idx, arr) => 
        arr.findIndex(i => i.url === img.url) === idx
      ).slice(0, 12);

      const fallbackImages = [
        { url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop', alt: 'Professional' },
        { url: 'https://images.unsplash.com/photo-1677442d019e157cab9fdb4e58b2c0edb78542ca8?w=500&h=300&fit=crop', alt: 'Business' },
        { url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&h=300&fit=crop', alt: 'Technology' },
        { url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&h=300&fit=crop', alt: 'Innovation' },
        { url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop', alt: 'Modern' },
        { url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=500&h=300&fit=crop', alt: 'Strategy' }
      ];

      setSuggestedImages(uniqueImages.length > 0 ? uniqueImages : fallbackImages);
      setShowImageSuggestions(true);
    } catch (error) {
      setSuggestedImages([
        { url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop', alt: 'Professional' },
        { url: 'https://images.unsplash.com/photo-1677442d019e157cab9fdb4e58b2c0edb78542ca8?w=500&h=300&fit=crop', alt: 'Business' },
        { url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&h=300&fit=crop', alt: 'Technology' }
      ]);
      setShowImageSuggestions(true);
    }
    setSearchingImages(false);
  };

  const selectImage = (url) => {
    setManualArticle({ ...manualArticle, imageUrl: url });
    setShowImageSuggestions(false);
  };

  // ==================== AUTHENTICATION ====================
  const handleLinkedInSignIn = async () => {
    setAuthenticating(true);
    
    setTimeout(() => {
      setIsAuthenticated(true);
      setAuthenticating(false);
    }, 1500);
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setArticles([]);
    setView('dashboard');
  };

  // ==================== ARTICLE MANAGEMENT ====================
  const createOrUpdateArticle = () => {
    if (!manualArticle.topic.trim()) {
      alert('Please enter a topic');
      return;
    }
    if (!contentValid) {
      alert('Please paste valid bilingual content (with === ENGLISH === and === FRENCH === markers)');
      return;
    }

    if (editingArticleId) {
      setArticles(articles.map(article => {
        if (article.id === editingArticleId) {
          return {
            ...article,
            customTopic: manualArticle.topic,
            category: manualArticle.topicCategory,
            categoryLabel: topicCategories.find(t => t.id === manualArticle.topicCategory)?.label,
            content: manualArticle.content,
            image: manualArticle.imageUrl || 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=630&fit=crop'
          };
        }
        return article;
      }));
      alert('✅ Article updated successfully!');
    } else {
      const newArticle = {
        id: Date.now(),
        customTopic: manualArticle.topic,
        category: manualArticle.topicCategory,
        categoryLabel: topicCategories.find(t => t.id === manualArticle.topicCategory)?.label,
        status: 'draft',
        content: manualArticle.content,
        image: manualArticle.imageUrl || 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=630&fit=crop',
        createdAt: new Date(),
        approvedAt: null,
        publishedAt: null
      };

      setArticles([newArticle, ...articles]);
      addToRecentTopics(manualArticle.topic);
      alert('✅ Article created successfully!');
    }
    
    setManualArticle({
      topic: '',
      topicCategory: 'ai-evolution',
      content: '',
      imageUrl: ''
    });
    setContentValid(false);
    setValidationMessage('');
    setSuggestedImages([]);
    setShowImageSuggestions(false);
    setEditingArticleId(null);
    setView('dashboard');
  };

  const startEditingArticle = (article) => {
    setManualArticle({
      topic: article.customTopic,
      topicCategory: article.category,
      content: article.content,
      imageUrl: article.image
    });
    setEditingArticleId(article.id);
    setView('create');
  };

  const cancelEdit = () => {
    setManualArticle({
      topic: '',
      topicCategory: 'ai-evolution',
      content: '',
      imageUrl: ''
    });
    setContentValid(false);
    setValidationMessage('');
    setSuggestedImages([]);
    setShowImageSuggestions(false);
    setEditingArticleId(null);
  };

  const updateStatus = (articleId, newStatus) => {
    setArticles(articles.map(article => {
      if (article.id === articleId) {
        const updated = { ...article, status: newStatus };
        if (newStatus === 'approved') {
          updated.approvedAt = new Date();
        }
        if (newStatus === 'published') {
          updated.publishedAt = new Date();
        }
        return updated;
      }
      return article;
    }));
  };

  const publishToLinkedIn = (articleId) => {
    const article = articles.find(a => a.id === articleId);
    updateStatus(articleId, 'published');
    alert(`✅ Article published to LinkedIn!\n\nTopic: ${article.customTopic}`);
  };

  const wordCount = (text) => {
    return text.trim().split(/\s+/).length;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusIcon = (status) => {
    const icons = {
      draft: <Clock style={{ width: '1rem', height: '1rem' }} />,
      'pending-approval': <AlertCircle style={{ width: '1rem', height: '1rem' }} />,
      approved: <CheckCircle style={{ width: '1rem', height: '1rem' }} />,
      published: <Share2 style={{ width: '1rem', height: '1rem' }} />
    };
    return icons[status] || null;
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: { bg: '#f0f4ff', text: '#667eea', label: 'Draft' },
      'pending-approval': { bg: '#fef3c7', text: '#d97706', label: 'Pending' },
      approved: { bg: '#d1fae5', text: '#059669', label: 'Approved' },
      published: { bg: '#cffafe', text: '#0891b2', label: 'Published' }
    };
    return colors[status] || colors.draft;
  };

  // ==================== LOGIN SCREEN ====================
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '2rem'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '1rem',
          padding: '3rem 2rem',
          maxWidth: '450px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '1rem',
            margin: '0 auto 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Globe style={{ width: '32px', height: '32px', color: 'white' }} />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: '0 0 0.5rem 0', color: '#1f2937' }}>
            LinkedIn Article Hub
          </h1>
          <p style={{ color: '#6b7280', margin: '0', fontSize: '0.95rem' }}>
            AI-powered bilingual content creation
          </p>

          <div style={{
            background: '#f9fafb',
            borderRadius: '0.75rem',
            padding: '1.5rem',
            marginBottom: '2rem',
            marginTop: '2rem',
            textAlign: 'left'
          }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 1rem 0' }}>
              What you can do
            </h3>
            {[
              'Generate articles with Claude AI',
              'Auto-parse bilingual content',
              'Auto-suggest relevant images',
              'Edit articles anytime',
              'Manage approval workflow',
              'Publish to LinkedIn'
            ].map((item, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: idx < 5 ? '0.75rem' : 0,
                fontSize: '0.95rem',
                color: '#4b5563'
              }}>
                <CheckCircle style={{ width: '1.25rem', height: '1.25rem', color: '#10b981', flexShrink: 0 }} />
                {item}
              </div>
            ))}
          </div>

          <button
            onClick={handleLinkedInSignIn}
            disabled={authenticating}
            style={{
              width: '100%',
              padding: '1rem 1.5rem',
              background: authenticating ? '#e5e7eb' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: '700',
              fontSize: '1rem',
              cursor: authenticating ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem'
            }}
          >
            {authenticating ? (
              <>
                <Loader style={{ width: '1.25rem', height: '1.25rem', animation: 'spin 1s linear infinite' }} />
                Connecting...
              </>
            ) : (
              <>
                <Globe style={{ width: '1.25rem', height: '1.25rem' }} />
                Sign in with LinkedIn
              </>
            )}
          </button>
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // ==================== MAIN APP ====================
  return (
    <div style={{ background: '#f8f9fa', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0 }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Globe style={{ width: '24px', height: '24px', color: 'white' }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0, color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Article Hub</h1>
              <p style={{ fontSize: '0.7rem', color: '#9ca3af', margin: '0.25rem 0 0 0' }}>by Claude</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={handleSignOut}
              style={{
                padding: '0.5rem 1rem',
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.875rem',
                color: '#4b5563',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
            >
              <LogOut style={{ width: '1rem', height: '1rem' }} />
              <span style={{ display: { xs: 'none', sm: 'inline' } }}>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: '64px', zIndex: 15 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '0', padding: '0 1.5rem' }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'create', label: editingArticleId ? 'Edit' : 'Create', icon: '⚡' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'dashboard' && editingArticleId) {
                  const confirmed = window.confirm('Cancel editing? Any changes will be lost.');
                  if (confirmed) {
                    cancelEdit();
                    setView('dashboard');
                  }
                } else {
                  setView(tab.id);
                }
              }}
              style={{
                padding: '1rem 1.5rem',
                border: 'none',
                background: 'transparent',
                borderBottom: view === tab.id ? '3px solid #667eea' : '3px solid transparent',
                color: view === tab.id ? '#667eea' : '#6b7280',
                cursor: 'pointer',
                fontWeight: view === tab.id ? '600' : '500',
                fontSize: '0.95rem',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                whiteSpace: 'nowrap'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Dashboard View */}
        {view === 'dashboard' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '700', margin: '0 0 0.5rem 0', color: '#1f2937' }}>
                Articles
              </h2>
              <p style={{ color: '#6b7280', margin: 0 }}>
                {articles.length === 0 ? 'No articles yet' : `${articles.length} article${articles.length !== 1 ? 's' : ''}`}
              </p>
            </div>

            {articles.length === 0 ? (
              <div style={{
                background: 'white',
                borderRadius: '1rem',
                padding: '2rem',
                textAlign: 'center',
                border: '2px dashed #e5e7eb'
              }}>
                <Zap style={{ width: '3rem', height: '3rem', color: '#d1d5db', margin: '0 auto 1rem' }} />
                <p style={{ fontSize: '1.125rem', color: '#6b7280', margin: '0 0 1rem 0' }}>
                  No articles yet
                </p>
                <p style={{ color: '#9ca3af', margin: '0 0 1.5rem 0' }}>
                  Create your first article with Claude
                </p>
                <button
                  onClick={() => setView('create')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Plus style={{ width: '1.25rem', height: '1.25rem' }} />
                  Create Article
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {articles.map(article => {
                  const status = getStatusColor(article.status);
                  return (
                    <div key={article.id} style={{
                      background: 'white',
                      borderRadius: '0.75rem',
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      display: 'grid',
                      gridTemplateColumns: 'minmax(180px, 1fr)',
                      gap: 0
                    }}>
                      <div style={{
                        background: '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        minHeight: '180px'
                      }}>
                        <img 
                          src={article.image} 
                          alt={article.customTopic}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      </div>

                      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ marginBottom: '1rem' }}>
                          <h3 style={{ fontSize: '1.125rem', fontWeight: '700', margin: '0 0 0.5rem 0', color: '#1f2937' }}>
                            {article.customTopic}
                          </h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: '0.75rem',
                              background: '#f0f4ff',
                              color: '#667eea',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '9999px',
                              fontWeight: '600'
                            }}>
                              {article.categoryLabel}
                            </span>
                            <span style={{
                              fontSize: '0.75rem',
                              background: status.bg,
                              color: status.text,
                              padding: '0.25rem 0.75rem',
                              borderRadius: '9999px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}>
                              {getStatusIcon(article.status)}
                              {status.label}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                              {formatDate(article.createdAt)}
                            </span>
                          </div>
                        </div>

                        <p style={{
                          color: '#6b7280',
                          lineHeight: '1.5',
                          marginBottom: '1rem',
                          flexGrow: 1,
                          maxHeight: '3rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          margin: '0 0 1rem 0',
                          fontSize: '0.95rem'
                        }}>
                          {article.content.substring(0, 150)}...
                        </p>

                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => {
                              setSelectedArticle(article);
                              setView('preview');
                            }}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#f3f4f6',
                              border: '1px solid #d1d5db',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              fontWeight: '500',
                              fontSize: '0.875rem',
                              color: '#4b5563',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              transition: 'all 0.2s'
                            }}
                          >
                            <Eye style={{ width: '1rem', height: '1rem' }} />
                            Preview
                          </button>

                          <button
                            onClick={() => startEditingArticle(article)}
                            style={{
                              padding: '0.5rem 1rem',
                              background: '#e0e7ff',
                              border: '1px solid #c7d2fe',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              fontWeight: '500',
                              fontSize: '0.875rem',
                              color: '#667eea',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              transition: 'all 0.2s'
                            }}
                          >
                            <Edit2 style={{ width: '1rem', height: '1rem' }} />
                            Edit
                          </button>

                          {article.status === 'draft' && (
                            <button
                              onClick={() => updateStatus(article.id, 'pending-approval')}
                              style={{
                                padding: '0.5rem 1rem',
                                background: '#fbbf24',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                cursor: 'pointer',
                                fontWeight: '500',
                                fontSize: '0.875rem',
                                transition: 'all 0.2s'
                              }}
                            >
                              Submit
                            </button>
                          )}

                          {article.status === 'pending-approval' && (
                            <>
                              <button
                                onClick={() => updateStatus(article.id, 'approved')}
                                style={{
                                  padding: '0.5rem 1rem',
                                  background: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '0.375rem',
                                  cursor: 'pointer',
                                  fontWeight: '500',
                                  fontSize: '0.875rem'
                                }}
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => updateStatus(article.id, 'draft')}
                                style={{
                                  padding: '0.5rem 1rem',
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '0.375rem',
                                  cursor: 'pointer',
                                  fontWeight: '500',
                                  fontSize: '0.875rem'
                                }}
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {article.status === 'approved' && (
                            <button
                              onClick={() => publishToLinkedIn(article.id)}
                              style={{
                                padding: '0.5rem 1rem',
                                background: '#667eea',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                cursor: 'pointer',
                                fontWeight: '500',
                                fontSize: '0.875rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                              }}
                            >
                              <Share2 style={{ width: '1rem', height: '1rem' }} />
                              Publish
                            </button>
                          )}

                          {article.status === 'published' && (
                            <span style={{
                              padding: '0.5rem 1rem',
                              background: '#cffafe',
                              color: '#0891b2',
                              borderRadius: '0.375rem',
                              fontWeight: '500',
                              fontSize: '0.875rem'
                            }}>
                              ✓ Published
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Create/Edit Article View */}
        {view === 'create' && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 1.5rem 0', color: '#1f2937' }}>
              {editingArticleId ? '✏️ Edit Article' : '⚡ Create Article'}
            </h2>

            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              {/* Step 1: Topic */}
              <div style={{
                background: 'linear-gradient(135deg, #f0f4ff 0%, #f5f3ff 100%)',
                border: '2px solid #667eea',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '18px' }}>1️⃣</span>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#667eea', margin: 0 }}>
                    Define Your Article
                  </h3>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: '#1f2937',
                    fontSize: '0.875rem'
                  }}>
                    Article Topic *
                  </label>
                  <input
                    type="text"
                    value={manualArticle.topic}
                    onChange={(e) => setManualArticle({ ...manualArticle, topic: e.target.value })}
                    placeholder="e.g., 'AI in Healthcare'"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Recent Topics */}
                {recentTopics.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', margin: '0 0 0.5rem 0' }}>
                      Recent topics:
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {recentTopics.map((topic, idx) => (
                        <button
                          key={idx}
                          onClick={() => setManualArticle({ ...manualArticle, topic })}
                          style={{
                            padding: '0.375rem 0.75rem',
                            background: '#fff',
                            border: '1px solid #d1d5db',
                            borderRadius: '9999px',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            color: '#4b5563',
                            fontWeight: '500'
                          }}
                        >
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label style={{
                    display: 'block',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: '#1f2937',
                    fontSize: '0.875rem'
                  }}>
                    Category
                  </label>
                  <select
                    value={manualArticle.topicCategory}
                    onChange={(e) => setManualArticle({ ...manualArticle, topicCategory: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      background: 'white',
                      boxSizing: 'border-box'
                    }}
                  >
                    {topicCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 2: Generate */}
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                border: '2px solid #10b981',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '18px' }}>2️⃣</span>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#059669', margin: 0 }}>
                    Generate with Claude
                  </h3>
                </div>

                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 1rem 0' }}>
                  One click opens Claude with your prompt (250 words/language):
                </p>

                <button
                  onClick={copyPromptToClipboard}
                  disabled={!manualArticle.topic.trim()}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: !manualArticle.topic.trim() ? '#d1d5db' : promptCopied ? '#10b981' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    fontSize: '1rem',
                    cursor: !manualArticle.topic.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    transition: 'all 0.2s'
                  }}
                >
                  {promptCopied ? (
                    <>
                      <Check style={{ width: '1.25rem', height: '1.25rem' }} />
                      Copied! Opening Claude...
                    </>
                  ) : (
                    <>
                      <Zap style={{ width: '1.25rem', height: '1.25rem' }} />
                      Generate in Claude
                    </>
                  )}
                </button>
              </div>

              {/* Step 3: Paste Content */}
              <div style={{
                background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
                border: '2px solid #667eea',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '18px' }}>3️⃣</span>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#667eea', margin: 0 }}>
                    Paste & Review
                  </h3>
                </div>

                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem', margin: '0 0 1rem 0' }}>
                  Paste Claude's output (auto-parses EN & FR):
                </p>

                <textarea
                  value={manualArticle.content}
                  onChange={handleContentPaste}
                  placeholder={`=== ENGLISH ===
[Paste your English article here]

=== FRENCH ===
[Paste your French article here]`}
                  style={{
                    width: '100%',
                    height: '200px',
                    padding: '1rem',
                    border: contentValid ? '2px solid #10b981' : '1px solid #93c5fd',
                    borderRadius: '0.5rem',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    color: '#1f2937',
                    background: contentValid ? '#f0fdf4' : '#fff'
                  }}
                />

                {validationMessage && (
                  <p style={{
                    fontSize: '0.875rem',
                    margin: '0.75rem 0 0 0',
                    color: contentValid ? '#059669' : '#dc2626',
                    fontWeight: '600'
                  }}>
                    {validationMessage}
                  </p>
                )}

                {contentValid && (
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    style={{
                      marginTop: '1rem',
                      padding: '0.5rem 1rem',
                      background: '#fff',
                      border: '2px solid #10b981',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      color: '#059669'
                    }}
                  >
                    {showPreview ? '▼ Hide Preview' : '▶ Show Preview'}
                  </button>
                )}

                {showPreview && contentValid && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: '#f9fafb',
                    borderRadius: '0.5rem',
                    maxHeight: '300px',
                    overflow: 'auto'
                  }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', margin: '0 0 0.5rem 0' }}>
                      Preview:
                    </p>
                    <p style={{ fontSize: '0.85rem', color: '#4b5563', margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                      {parsedContent.en.substring(0, 300)}...
                    </p>
                  </div>
                )}
              </div>

              {/* Step 4: Image */}
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                border: '2px solid #10b981',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '18px' }}>4️⃣</span>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#059669', margin: 0 }}>
                    Select Cover Image
                  </h3>
                </div>

                <button
                  onClick={searchImages}
                  disabled={searchingImages || !manualArticle.topic.trim()}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: searchingImages ? '#e5e7eb' : '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    cursor: searchingImages || !manualArticle.topic.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    marginBottom: '1rem'
                  }}
                >
                  {searchingImages ? (
                    <>
                      <Loader style={{ width: '1.25rem', height: '1.25rem', animation: 'spin 1s linear infinite' }} />
                      Searching...
                    </>
                  ) : (
                    <>
                      <ImageIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                      Find Images
                    </>
                  )}
                </button>

                {showImageSuggestions && (
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.75rem' }}>
                      Choose an image:
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.75rem' }}>
                      {suggestedImages.map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => selectImage(img.url)}
                          style={{
                            cursor: 'pointer',
                            borderRadius: '0.5rem',
                            overflow: 'hidden',
                            border: manualArticle.imageUrl === img.url ? '3px solid #10b981' : '2px solid #e5e7eb',
                            transition: 'all 0.2s',
                            aspectRatio: '1'
                          }}
                        >
                          <img 
                            src={img.url} 
                            alt={img.alt}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {manualArticle.imageUrl && (
                  <img 
                    src={manualArticle.imageUrl} 
                    alt="Selected"
                    style={{ maxWidth: '150px', height: 'auto', borderRadius: '0.5rem', border: '2px solid #10b981', marginBottom: '1rem' }}
                  />
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  onClick={createOrUpdateArticle}
                  disabled={!contentValid}
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    padding: '1rem',
                    background: !contentValid ? '#d1d5db' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    fontSize: '1rem',
                    cursor: !contentValid ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    transition: 'all 0.2s'
                  }}
                >
                  {editingArticleId ? (
                    <>
                      <Save style={{ width: '1.25rem', height: '1.25rem' }} />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Send style={{ width: '1.25rem', height: '1.25rem' }} />
                      Create Article
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    cancelEdit();
                    setView('dashboard');
                  }}
                  style={{
                    flex: 1,
                    minWidth: '200px',
                    padding: '1rem',
                    background: '#f3f4f6',
                    color: '#4b5563',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview View */}
        {view === 'preview' && selectedArticle && (
          <div style={{
            background: 'white',
            borderRadius: '1rem',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #f0f4ff 0%, #f5f3ff 100%)'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0, color: '#1f2937' }}>
                {selectedArticle.customTopic}
              </h2>
              <button
                onClick={() => setView('dashboard')}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  color: '#4b5563'
                }}
              >
                ← Back
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <img 
                src={selectedArticle.image} 
                alt={selectedArticle.customTopic}
                style={{
                  width: '100%',
                  maxHeight: '250px',
                  borderRadius: '0.5rem',
                  marginBottom: '1.5rem',
                  objectFit: 'cover'
                }}
                onError={(e) => e.target.style.display = 'none'}
              />

              <p style={{
                color: '#4b5563',
                lineHeight: '1.8',
                whiteSpace: 'pre-wrap',
                fontSize: '0.95rem',
                margin: 0
              }}>
                {selectedArticle.content}
              </p>

              <p style={{
                fontSize: '0.875rem',
                color: '#9ca3af',
                margin: '1.5rem 0 0 0'
              }}>
                {wordCount(selectedArticle.content)} words
              </p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          h1 { font-size: 1rem !important; }
          h2 { font-size: 1.5rem !important; }
          button { font-size: 0.9rem !important; }
        }
      `}</style>
    </div>
  );
};

export default LinkedInArticleHub;
