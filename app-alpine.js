// Alpine.js Data Component
document.addEventListener('alpine:init', () => {
    Alpine.data('speakersApp', () => ({
        // State
        currentLang: 'pt',
        translations: {},
        jsonInput: '',
        data: [],
        error: null,

        // Lifecycle
        async init() {
            // Load saved language preference
            const savedLang = localStorage.getItem('preferredLanguage');
            if (savedLang) {
                this.currentLang = savedLang;
            }

            // Load translations
            await this.loadTranslations();

            // Set page title after translations load
            document.title = this.t('pageTitle');

            // Try to load speakers.json
            try {
                const response = await fetch(CONFIG.asset('speakers.json'));
                const data = await response.json();
                this.jsonInput = JSON.stringify(data, null, 2);
                this.parseJSON();
            } catch (error) {
                console.log('No speakers.json found, waiting for user input');
            }
        },

        // Methods
        async loadTranslations() {
            try {
                const response = await fetch(CONFIG.asset('translations.json'));
                this.translations = await response.json();
            } catch (error) {
                console.error('Error loading translations:', error);
            }
        },

        t(key) {
            return this.translations[this.currentLang]?.[key] || key;
        },

        get months() {
            return this.t('months') || [];
        },

        changeLanguage() {
            localStorage.setItem('preferredLanguage', this.currentLang);
            document.documentElement.lang = this.currentLang;
            document.title = this.t('pageTitle');
        },

        parseJSON() {
            this.error = null;

            if (!this.jsonInput.trim()) {
                this.error = this.t('errorEmpty');
                this.data = [];
                return;
            }

            try {
                this.data = JSON.parse(this.jsonInput);
            } catch (err) {
                this.error = `${this.t('errorParsing')}: ${err.message}`;
                this.data = [];
            }
        },

        formatDate(dateString) {
            if (!dateString) return '';
            const parts = dateString.split('/');
            const date = new Date(parts[0], parts[1] - 1, parts[2]);
            const month = this.months[date.getMonth()];
            const day = date.getDate();
            const year = date.getFullYear();
            return { month, day, year };
        },

        hasException(entry) {
            return !!(entry.chairman || entry.reader);
        },

        getEventType(entry) {
            if (entry.type === 'C') return this.t('regionalConvention');
            if (entry.type === 'A') return this.t('circuitAssembly');
            if (entry.type === 'E') return this.t('specialTalk');
            return '';
        },

        print() {
            window.print();
        }
    }));
});
