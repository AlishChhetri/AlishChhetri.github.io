class HexagonNavigation {
    constructor() {
        this.container = document.querySelector('.hexagon-container');
        this.centerHex = document.querySelector('.hexagon-center');
        this.subHexagons = document.querySelectorAll('.hexagon-sub');
        this.currentSection = 'main';
        this.isAnimating = false;
        this.navigationData = null;

        this.subHexagons.forEach(hex => hex.classList.add('empty'));

        this.init();
    }

    async init() {
        try {
            const response = await fetch('/assets/js/hexagon_navigation.json');
            if (!response.ok) throw new Error(`Failed to fetch navigation data: ${response.status}`);
            this.navigationData = await response.json();

            this.updateContent('main');

            this.subHexagons.forEach((hex, index) => {
                hex.addEventListener('click', (event) => {
                    if (!this.isAnimating && !hex.classList.contains('empty')) {
                        this.handleHexagonClick(index, event);
                    }
                });
            });

            this.centerHex.addEventListener('click', () => {
                if (!this.isAnimating && this.navigationData[this.currentSection]?.parent) {
                    this.navigateBack();
                }
            });

            this.centerHex.classList.add('state-idle');
            this.subHexagons.forEach(hex => hex.classList.add('state-idle'));
        } catch (error) {
            console.error('Error initializing hexagon navigation:', error);
        }
    }

    handleHexagonClick(index, event) {
        const section = this.navigationData[this.currentSection];
        if (!section || !section.subs || index >= section.subs.length) return;

        const clickedItem = section.subs[index];
        if (!clickedItem || !clickedItem.path) return;

        if (clickedItem.type === 'page') {
            window.location.href = clickedItem.path;
        } else if (clickedItem.type === 'download') {
            this.downloadFile(clickedItem.path);
        } else {
            event.preventDefault();
            this.changeSection(clickedItem.path);
        }
    }

    downloadFile(filePath, fileName) {
        const downloadLink = document.createElement('a');
        downloadLink.href = filePath;
        downloadLink.download = fileName || 'download';
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);
        downloadLink.click();

        setTimeout(() => {
            document.body.removeChild(downloadLink);
        }, 100);
    }

    updateContent(section) {
        const data = this.navigationData[section];
        if (!data) return;

        this.centerHex.querySelector('.hexagon-text').textContent = data.center;

        if (data.parent) {
            this.centerHex.classList.add('has-parent');
        } else {
            this.centerHex.classList.remove('has-parent');
        }

        this.subHexagons.forEach((hex, index) => {
            const textElement = hex.querySelector('.hexagon-text');

            if (index >= data.subs.length) {
                hex.style.display = 'none';
                return;
            }

            const item = data.subs[index];
            hex.style.display = 'flex';

            if (item.type === 'empty' || !item.name) {
                textElement.textContent = '';
                hex.classList.add('empty');
                hex.classList.remove('directory');
                hex.removeAttribute('data-section');
                hex.removeAttribute('data-page');
                hex.removeAttribute('data-download');
                return;
            }

            textElement.textContent = item.name;
            hex.classList.remove('empty');

            if (item.type === 'directory') {
                hex.classList.add('directory');
                hex.setAttribute('data-section', item.path);
                hex.removeAttribute('data-page');
                hex.removeAttribute('data-download');
            } else if (item.type === 'page') {
                hex.classList.remove('directory');
                hex.setAttribute('data-page', item.path);
                hex.removeAttribute('data-section');
                hex.removeAttribute('data-download');
            } else if (item.type === 'download') {
                hex.classList.remove('directory');
                hex.setAttribute('data-download', item.path);
                hex.removeAttribute('data-section');
                hex.removeAttribute('data-page');
            } else {
                hex.classList.remove('directory');
                hex.removeAttribute('data-section');
                hex.removeAttribute('data-page');
                hex.removeAttribute('data-download');
            }
        });

        this.currentSection = section;
    }

    changeSection(sectionKey) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        this.centerHex.classList.remove('state-idle');
        this.centerHex.classList.add('state-changing');

        const visibleHexagons = Array.from(this.subHexagons).filter(hex => hex.style.display !== 'none');
        visibleHexagons.forEach(hex => {
            hex.classList.remove('state-idle');
            hex.classList.add('state-converging');
        });

        setTimeout(() => {
            this.updateContent(sectionKey);

            visibleHexagons.forEach(hex => {
                hex.classList.remove('state-converging');
                hex.classList.add('state-dispersing');
            });

            setTimeout(() => {
                const newVisibleHexagons = Array.from(this.subHexagons).filter(hex => hex.style.display !== 'none');
                newVisibleHexagons.forEach(hex => {
                    hex.classList.remove('state-dispersing');
                    hex.classList.add('state-returning');
                });

                this.centerHex.classList.remove('state-changing');
                this.centerHex.classList.add('state-idle');

                setTimeout(() => {
                    newVisibleHexagons.forEach(hex => {
                        hex.classList.remove('state-returning');
                        hex.classList.add('state-idle');
                    });
                    this.isAnimating = false;
                }, 300);
            }, 150);
        }, 300);
    }

    navigateBack() {
        const parentSection = this.navigationData[this.currentSection].parent;
        if (parentSection) {
            this.changeSection(parentSection);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new HexagonNavigation();
});
