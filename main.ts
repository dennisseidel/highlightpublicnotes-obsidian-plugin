import {
  App,
  Plugin,
  PluginSettingTab,
  Setting,
  CachedMetadata,
  TFile,
  WorkspaceLeaf,
} from 'obsidian';

interface PluginSettings {
  useFrontmatterHighlight: boolean;
  usePathHighlight: boolean;
  frontmatterAttribute: string;
  valueToHighlight: string;
  pathToHighlight: string;
  uiElementToHighlight: string;
}

const optionToCssSpecifierMapping = {
  Corner: 'workspace-tab-header-container-inner',
  Titlebar: 'titlebar',
  Header: 'view-header',
  Content: 'view-content',
};

const DEFAULT_SETTINGS: PluginSettings = {
  useFrontmatterHighlight: true,
  usePathHighlight: false,
  frontmatterAttribute: 'classification',
  valueToHighlight: 'public',
  pathToHighlight: '',
  uiElementToHighlight: optionToCssSpecifierMapping.Corner,
};

export default class HighlightpublicnotesPlugin extends Plugin {
  settings: PluginSettings;

  async onload() {
    // this.highlightNote = this.highlightNote.bind(this);
    // this.unhighlightNote = this.unhighlightNote.bind(this);
    // this.onFileOpen = this.onFileOpen.bind(this);

    await this.loadSettings();
    const { workspace } = this.app;
    // this.registerEvent(workspace.on('file-open', this.onFileOpen, this));

    this.registerEvent(
      workspace.on(
        'active-leaf-change',
        (leaf: WorkspaceLeaf) => {
          console.log({ leaf });
          const file = (leaf as any)?.workspace?.activeLeaf?.view
            ?.file as TFile;
          if (file) {
            return this.onFileOpen(file).catch(console.log);
          }
          this.unhighlightNote();
        },
        this
      )
    );
    this.addSettingTab(new SettingTab(this.app, this));
  }

  async onFileOpen(file: TFile) {
    if (!file && this.settings.useFrontmatterHighlight) {
      // if not in higlighte path check classifiedFrontmatter
      this.higlightClassifiedFrontmatterFile(file);
    }
    if (!file || file.extension !== 'md') return;

    // check for path highlighting first
    if (this.settings.usePathHighlight) {
      if (this.checkPath(file.path, this.settings.pathToHighlight)) {
        this.highlightNote();
      } else {
        this.unhighlightNote();
        // if not in higlighte path check classifiedFrontmatter
        this.higlightClassifiedFrontmatterFile(file);
      }
    } else if (this.settings.useFrontmatterHighlight) {
      // if no path hilighting check for frontmatter highlighting
      this.higlightClassifiedFrontmatterFile(file);
    }
  }

  private higlightClassifiedFrontmatterFile(file: TFile) {
    try {
      const classification =
        this.app.metadataCache.getFileCache(file)?.frontmatter?.[
          this.settings.frontmatterAttribute
        ];
      const normalizedClassification = classification?.toString().toLowerCase();
      const valueToHighlight = this.settings.valueToHighlight;
      const normalizedValueToHighlight = valueToHighlight
        ?.toString()
        .toLowerCase();
      if (normalizedClassification == normalizedValueToHighlight) {
        this.highlightNote();
      } else {
        this.unhighlightNote();
      }
    } catch (err) {
      console.log({ err });
    }
  }

  private highlightNote() {
    const $targets = document.getElementsByClassName(
      this.settings.uiElementToHighlight
    );
    if ($targets) {
      const $target = $targets[0];
      if (this.settings.uiElementToHighlight == 'titlebar') {
        $target.classList.add('myalert');
      } else {
        $target.classList.add('myalert-light');
      }
    }
  }

  private unhighlightNote() {
    const $targets = document.getElementsByClassName(
      this.settings.uiElementToHighlight
    );
    if ($targets) {
      const $target = $targets[0];
      if (this.settings.uiElementToHighlight == 'titlebar') {
        $target.classList.remove('myalert');
      } else {
        $target.classList.remove('myalert-light');
      }
    }
  }

  private checkPath(currentPath: string, blacklistedPath: string): boolean {
    return currentPath.includes(blacklistedPath);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class SettingTab extends PluginSettingTab {
  plugin: HighlightpublicnotesPlugin;

  constructor(app: App, plugin: HighlightpublicnotesPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName('Object to highlight')
      .setDesc('Either select the titlebar, the header or the content.')
      .addDropdown((dropdown) => {
        return dropdown
          .addOption(optionToCssSpecifierMapping.Corner, 'Corner')
          .addOption(optionToCssSpecifierMapping.Titlebar, 'titlebar')
          .addOption(optionToCssSpecifierMapping.Header, 'Header')
          .addOption(optionToCssSpecifierMapping.Content, 'Content')
          .setValue(this.plugin.settings.uiElementToHighlight)
          .onChange((value) => {
            this.plugin.settings.uiElementToHighlight = value;
            this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('check frontmatter')
      .setDesc('use frontmatter highlighting')
      .addToggle((toogle) => {
        toogle
          .setValue(this.plugin.settings.useFrontmatterHighlight)
          .onChange(async (_) => {
            this.plugin.settings.useFrontmatterHighlight =
              !this.plugin.settings.useFrontmatterHighlight;
            await this.plugin.saveSettings();
            this.display();
          });
      });

    new Setting(containerEl)
      .setName('check path')
      .setDesc('use path highlighting')
      .addToggle((toogle) => {
        toogle
          .setValue(this.plugin.settings.usePathHighlight)
          .onChange(async (_) => {
            this.plugin.settings.usePathHighlight =
              !this.plugin.settings.usePathHighlight;
            await this.plugin.saveSettings();
            this.display();
          });
      });

    if (this.plugin.settings.useFrontmatterHighlight) {
      this.addFrontMatterSettings(containerEl);
    }
    if (this.plugin.settings.usePathHighlight) {
      this.addPathHighlightSettings(containerEl);
    }
  }

  addPathHighlightSettings(container: HTMLElement): void {
    container.createEl('h3', {
      text: 'Path Highlight Settings',
    });
    new Setting(container)
      .setName('Path')
      .setDesc('a path to highlight')
      .addText((text) =>
        text
          .setPlaceholder('')
          .setValue(this.plugin.settings.pathToHighlight)
          .onChange(async (value) => {
            this.plugin.settings.pathToHighlight = value;
            await this.plugin.saveSettings();
          })
      );
  }

  addFrontMatterSettings(container: HTMLElement): void {
    container.createEl('h3', {
      text: 'Frontmatter Settings',
    });
    new Setting(container)
      .setName('Attribute')
      .setDesc('the attribute in the frontmatter that indicates the visiblity')
      .addText((text) =>
        text
          .setPlaceholder('classification')
          .setValue(this.plugin.settings.frontmatterAttribute)
          .onChange(async (value) => {
            this.plugin.settings.frontmatterAttribute = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(container)
      .setName('Value')
      .setDesc('the value that indicates public visibility')
      .addText((text) =>
        text
          .setPlaceholder('public')
          .setValue(this.plugin.settings.valueToHighlight)
          .onChange(async (value) => {
            this.plugin.settings.valueToHighlight = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
