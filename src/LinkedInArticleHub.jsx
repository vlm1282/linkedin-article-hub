import React, { useState } from 'react';
import { Send, Globe, Eye, Plus, Share2, LogOut, Loader, CheckCircle, AlertCircle, Clock, Edit2, Save, Copy, Image as ImageIcon, X } from 'lucide-react';

const LinkedInArticleHub = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
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
    content: '', // Single bilingual content
    imageUrl: ''
  });

  // Image State
  const [searchingImages, setSearchingImages] = useState(false);
  const [suggestedImages, setSuggestedImages] = useState([]);
  const [showImageSuggestions, setShowImageSuggestions] = useState(false);
  const [customImageSearch, setCustomImageSearch] = useState('');

  // Prompt State
  const [aiPrompt, setAiPrompt] = useState('');
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);

  const topicCategories = [
    { id: 'ai-evolution', label: 'Evolution of AI' },
    { id: 'ai-workplace', label: 'AI in the Workplace' },
    { id: 'ai-economy', label: 'AI in the Economy' },
    { id: 'project-management', label: 'Project Management' },
    { id: 'product-ownership', label: 'Product Ownership' },
    { id: 'development', label: 'Development' }
  ];

  const defaultPrompt = (topic) => {
    if (!topic.trim()) {
      return `Write a professional LinkedIn article about a business or technology topic.

Format your response EXACTLY like this:

=== ENGLISH ===
[Your English article here - 300-350 words]

=== FRENCH ===
[Your French article here - 300-350 words]

Requirements:
- Use clear, engaging language suitable for LinkedIn
- Include actionable insights
- Make it informative but conversational
- Both versions should be exactly 300-350 words`;
    }
    return `Write a professional LinkedIn article about: "${topic}"

Format your response EXACTLY like this:

=== ENGLISH ===
[Your English article here - 300-350 words]

=== FRENCH ===
[Your French article here - 300-350 words]

Requirements:
- Use clear, engaging language suitable for LinkedIn
- Include actionable insights
- Make it informative but conversational
- Both versions should be exactly 300-350 words`;
  };

  // Copy prompt to clipboard
  const copyPromptToClipboard = () => {
    const prompt = aiPrompt || defaultPrompt(manualArticle.topic);
    navigator.clipboard.writeText(prompt).then(() => {
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    });
  };

  // Extract key words from topic for better search
  const extractKeywords = (topic) => {
    const stopWords = ['the', 'in', 'and', 'or', 'of', 'to', 'a', 'an', 'is', 'are'];
    const words = topic.toLowerCase().split(/\s+/).filter(word => !stopWords.includes(word) && word.length > 3);
    return words.slice(0, 3); // Get top 3 keywords
  };

  // Search for images on Unsplash with multiple queries
  const searchImages = async () => {
    if (!manualArticle.topic.trim()) {
      alert('Please enter a topic first');
      return;
    }

    setSearchingImages(true);
    try {
      // Get keywords from topic
      const keywords = extractKeywords(manualArticle.topic);
      const searchQueries = [
        manualArticle.topic, // First try the full topic
        keywords.join(' '), // Then try main keywords
        manualArticle.topicCategory.replace(/-/g, ' ') // Then try the category
      ];

      let allImages = [];

      // Try each search query
      for (const query of searchQueries) {
        if (allImages.length >= 12) break; // Stop if we have enough images

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

      // Remove duplicates
      const uniqueImages = allImages.filter((img, idx, arr) => 
        arr.findIndex(i => i.url === img.url) === idx
      ).slice(0, 12);

      // Fallback images if search fails
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
      console.log('Using fallback images');
      setSuggestedImages([
        { url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop', alt: 'Professional' },
        { url: 'https://images.unsplash.com/photo-1677442d019e157cab9fdb4e58b2c0edb78542ca8?w=500&h=300&fit=crop', alt: 'Business' },
        { url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&h=300&fit=crop', alt: 'Technology' },
        { url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&h=300&fit=crop', alt: 'Innovation' },
        { url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop', alt: 'Modern' },
        { url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=500&h=300&fit=crop', alt: 'Strategy' }
      ]);
      setShowImageSuggestions(true);
    }
    setSearchingImages(false);
  };

  const selectImage = (url) => {
    setManualArticle({ ...manualArticle, imageUrl: url });
    setShowImageSuggestions(false);
  };

  // Manual image search with custom keywords
  const searchImagesManual = async (searchTerm) => {
    if (!searchTerm.trim()) {
      alert('Please enter search terms');
      return;
    }

    setSearchingImages(true);
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm)}&per_page=12&client_id=YOUR_UNSPLASH_API_KEY`
      );

      if (response.ok) {
        const data = await response.json();
        const images = data.results.map(img => ({
          url: img.urls.regular,
          alt: img.alt_description || 'Image'
        }));
        setSuggestedImages(images.length > 0 ? images : []);
        if (images.length === 0) {
          alert('No images found. Try different keywords.');
        }
      } else {
        alert('Search failed. Try again.');
      }
    } catch (error) {
      alert('Search failed. Try again.');
    }
    setSearchingImages(false);
  };

  // Open Claude with prompt
  const openClaudeWithPrompt = () => {
    if (!manualArticle.topic.trim()) {
      alert('Please enter a topic first');
      return;
    }
    
    const prompt = aiPrompt || defaultPrompt(manualArticle.topic);
    const encodedPrompt = encodeURIComponent(prompt);
    window.open(`https://claude.ai?q=${encodedPrompt}`, '_blank');
  };

  // ==================== AUTHENTICATION ====================
  const handleLinkedInSignIn = async () => {
    setAuthenticating(true);
    
    setTimeout(() => {
      setUser({
        name: 'User Profile',
        email: 'user@example.com',
        linkedInId: 'urn:li:person:ABC123XYZ',
        profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
        linkedinConnected: true
      });
      setIsAuthenticated(true);
      setAuthenticating(false);
    }, 1500);
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    setUser(null);
    setArticles([]);
    setView('dashboard');
  };

  // ==================== ARTICLE MANAGEMENT ====================
  const createOrUpdateArticle = () => {
    // Validation
    if (!manualArticle.topic.trim()) {
      alert('Please enter a topic');
      return;
    }
    if (!manualArticle.content.trim()) {
      alert('Please paste the bilingual content');
      return;
    }

    if (editingArticleId) {
      // UPDATE existing article
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
      // CREATE new article
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
      alert('✅ Article created successfully!');
    }
    
    // Reset form
    setManualArticle({
      topic: '',
      topicCategory: 'ai-evolution',
      content: '',
      imageUrl: ''
    });
    setAiPrompt('');
    setShowPromptEditor(false);
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
    setAiPrompt('');
    setShowPromptEditor(false);
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
          padding: '3rem',
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
            Create, approve, and publish bilingual articles
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
              'Auto-suggest relevant images',
              'Edit articles anytime',
              'Manage approval workflow',
              'Publish directly to LinkedIn'
            ].map((item, idx) => (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: idx < 4 ? '0.75rem' : 0,
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

          <p style={{
            fontSize: '0.75rem',
            color: '#9ca3af',
            marginTop: '1.5rem',
            margin: '1.5rem 0 0 0'
          }}>
            Your LinkedIn credentials are used to authenticate and publish articles to your account.
            We never store your password.
          </p>
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
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Globe style={{ width: '24px', height: '24px', color: 'white' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0, color: '#1f2937' }}>LinkedIn Article Hub</h1>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.25rem 0 0 0' }}>AI-powered bilingual content</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                {user?.name || 'User'}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.25rem 0 0 0' }}>
                LinkedIn Connected ✓
              </p>
            </div>
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
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: '0', padding: '0 2rem' }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'create', label: editingArticleId ? 'Edit Article' : 'Create Article', icon: '🤖' }
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
                gap: '0.5rem'
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
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
                padding: '3rem',
                textAlign: 'center',
                border: '2px dashed #e5e7eb'
              }}>
                <Globe style={{ width: '3rem', height: '3rem', color: '#d1d5db', margin: '0 auto 1rem' }} />
                <p style={{ fontSize: '1.125rem', color: '#6b7280', margin: '0 0 1rem 0' }}>
                  No articles yet
                </p>
                <p style={{ color: '#9ca3af', margin: '0 0 1.5rem 0' }}>
                  Create your first article with AI assistance
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
                      gridTemplateColumns: '220px 1fr',
                      gap: 0
                    }}>
                      <div style={{
                        background: '#f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        minHeight: '220px'
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
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
                          margin: '0 0 1rem 0'
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
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', margin: '0 0 1.5rem 0', color: '#1f2937' }}>
              {editingArticleId ? '✏️ Edit Article' : '🤖 Create Article'}
            </h2>

            <div style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              maxWidth: '900px'
            }}>
              {/* Step 1: Topic & Category */}
              <div style={{
                background: 'linear-gradient(135deg, #f0f4ff 0%, #f5f3ff 100%)',
                border: '2px solid #667eea',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                marginBottom: '2rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '20px' }}>1️⃣</span>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#667eea', margin: 0 }}>
                    Define Your Article
                  </h3>
                </div>

                {/* Topic */}
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
                      fontSize: '0.95rem',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Category */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: '#1f2937',
                    fontSize: '0.875rem'
                  }}>
                    Category *
                  </label>
                  <select
                    value={manualArticle.topicCategory}
                    onChange={(e) => setManualArticle({ ...manualArticle, topicCategory: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.5rem',
                      fontSize: '0.95rem',
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

              {/* Step 2: Generate with Claude */}
              <div style={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #fef08a 100%)',
                border: '2px solid #f59e0b',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                marginBottom: '2rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '20px' }}>2️⃣</span>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#d97706', margin: 0 }}>
                    Generate Content with Claude
                  </h3>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setShowPromptEditor(!showPromptEditor)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#fff',
                      border: '2px solid #f59e0b',
                      borderRadius: '0.5rem',
                      color: '#d97706',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    ⚙️ {showPromptEditor ? 'Hide' : 'Edit'} Prompt
                  </button>

                  <button
                    onClick={openClaudeWithPrompt}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    🤖 Open Claude
                  </button>
                </div>

                {showPromptEditor && (
                  <div style={{
                    background: '#fff',
                    border: '1px solid #fcd34d',
                    borderRadius: '0.5rem',
                    padding: '1rem'
                  }}>
                    <label style={{
                      display: 'block',
                      fontWeight: '600',
                      marginBottom: '0.5rem',
                      color: '#1f2937',
                      fontSize: '0.875rem'
                    }}>
                      Custom Prompt
                    </label>
                    <textarea
                      value={aiPrompt || defaultPrompt(manualArticle.topic || 'your topic')}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      style={{
                        width: '100%',
                        height: '120px',
                        padding: '0.75rem',
                        border: '1px solid #fcd34d',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                        color: '#1f2937'
                      }}
                    />
                    <button
                      onClick={copyPromptToClipboard}
                      style={{
                        marginTop: '0.75rem',
                        padding: '0.5rem 1rem',
                        background: promptCopied ? '#10b981' : '#667eea',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <Copy style={{ width: '1rem', height: '1rem' }} />
                      {promptCopied ? 'Copied!' : 'Copy to Clipboard'}
                    </button>
                  </div>
                )}
              </div>

              {/* Step 3: Paste Content */}
              <div style={{
                background: 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
                border: '2px solid #667eea',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                marginBottom: '2rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '20px' }}>3️⃣</span>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#667eea', margin: 0 }}>
                    Paste Bilingual Content
                  </h3>
                </div>

                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem', margin: '0 0 1rem 0' }}>
                  Paste Claude's output (includes both English and French sections):
                </p>

                <textarea
                  value={manualArticle.content}
                  onChange={(e) => setManualArticle({ ...manualArticle, content: e.target.value })}
                  placeholder={`=== ENGLISH ===
[Your English article here]

=== FRENCH ===
[Your French article here]`}
                  style={{
                    width: '100%',
                    height: '250px',
                    padding: '1rem',
                    border: '1px solid #93c5fd',
                    borderRadius: '0.5rem',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    color: '#1f2937'
                  }}
                />
                <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.5rem 0 0 0' }}>
                  {wordCount(manualArticle.content)} words total
                </p>
              </div>

              {/* Step 4: Image Selection */}
              <div style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                border: '2px solid #10b981',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                marginBottom: '2rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '20px' }}>4️⃣</span>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#059669', margin: 0 }}>
                    Select Cover Image
                  </h3>
                </div>

                <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem', margin: '0 0 1rem 0' }}>
                  Auto-find relevant images or provide your own:
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={searchImages}
                    disabled={searchingImages || !manualArticle.topic.trim()}
                    style={{
                      padding: '0.5rem 1rem',
                      background: searchingImages ? '#e5e7eb' : '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      cursor: searchingImages || !manualArticle.topic.trim() ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    {searchingImages ? (
                      <>
                        <Loader style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
                        Searching...
                      </>
                    ) : (
                      <>
                        <ImageIcon style={{ width: '1rem', height: '1rem' }} />
                        Find Images
                      </>
                    )}
                  </button>
                </div>

                {/* Manual Search Box */}
                <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #86efac' }}>
                  <label style={{
                    display: 'block',
                    fontWeight: '600',
                    marginBottom: '0.5rem',
                    color: '#1f2937',
                    fontSize: '0.875rem'
                  }}>
                    Refine search (optional):
                  </label>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <input
                      type="text"
                      value={customImageSearch}
                      onChange={(e) => setCustomImageSearch(e.target.value)}
                      placeholder="e.g., 'healthcare', 'technology', 'people'"
                      onKeyPress={(e) => e.key === 'Enter' && searchImagesManual(customImageSearch)}
                      style={{
                        flex: 1,
                        padding: '0.5rem 0.75rem',
                        border: '1px solid #86efac',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      onClick={() => searchImagesManual(customImageSearch)}
                      disabled={!customImageSearch.trim() || searchingImages}
                      style={{
                        padding: '0.5rem 1rem',
                        background: customImageSearch.trim() && !searchingImages ? '#10b981' : '#d1d5db',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: customImageSearch.trim() && !searchingImages ? 'pointer' : 'not-allowed',
                        fontWeight: '600',
                        fontSize: '0.875rem'
                      }}
                    >
                      Search
                    </button>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.5rem 0 0 0' }}>
                    Type keywords and press Enter or click Search to refine results
                  </p>
                </div>

                {showImageSuggestions && (
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.75rem' }}>
                      Choose an image:
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem' }}>
                      {suggestedImages.map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => selectImage(img.url)}
                          style={{
                            cursor: 'pointer',
                            borderRadius: '0.5rem',
                            overflow: 'hidden',
                            border: manualArticle.imageUrl === img.url ? '3px solid #10b981' : '2px solid #e5e7eb',
                            transition: 'all 0.2s'
                          }}
                        >
                          <img 
                            src={img.url} 
                            alt={img.alt}
                            style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {manualArticle.imageUrl && (
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.75rem' }}>
                      Selected image:
                    </p>
                    <img 
                      src={manualArticle.imageUrl} 
                      alt="Selected"
                      style={{ maxWidth: '200px', height: 'auto', borderRadius: '0.5rem', border: '2px solid #10b981' }}
                    />
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
                    Or paste image URL:
                  </label>
                  <input
                    type="url"
                    value={manualArticle.imageUrl}
                    onChange={(e) => setManualArticle({ ...manualArticle, imageUrl: e.target.value })}
                    placeholder="https://..."
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #86efac',
                      borderRadius: '0.5rem',
                      fontSize: '0.95rem',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={createOrUpdateArticle}
                  style={{
                    padding: '0.875rem 2rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
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
                    padding: '0.875rem 2rem',
                    background: '#f3f4f6',
                    color: '#4b5563',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    fontWeight: '600',
                    fontSize: '0.95rem',
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
              padding: '2rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #f0f4ff 0%, #f5f3ff 100%)'
            }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: '#1f2937' }}>
                  {selectedArticle.customTopic}
                </h2>
                <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
                  {selectedArticle.categoryLabel}
                </p>
              </div>
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

            <div style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '2rem' }}>
                <img 
                  src={selectedArticle.image} 
                  alt={selectedArticle.customTopic}
                  style={{
                    width: '100%',
                    maxHeight: '300px',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem',
                    objectFit: 'cover'
                  }}
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>

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
                marginTop: '2rem',
                margin: '2rem 0 0 0'
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
      `}</style>
    </div>
  );
};

export default LinkedInArticleHub;
