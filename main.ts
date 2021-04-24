import { App, Plugin, PluginSettingTab, Setting, CachedMetadata, TFile } from 'obsidian';

interface PluginSettings {
	useFrontmatterHighlight: boolean,
	usePathHighlight: boolean,
	fronmatterAttribute: string,
	valueToHighlight: string,
	pathToHighlight: string,
}

const DEFAULT_SETTINGS: PluginSettings = {
	useFrontmatterHighlight: true,
	usePathHighlight: false,
	fronmatterAttribute: 'classification',
	valueToHighlight: 'public',
	pathToHighlight: '',
}

export default class HighlightpublicnotesPlugin extends Plugin {
	settings: PluginSettings;

	async onload() {
		await this.loadSettings();
		const { workspace } = this.app
		this.registerEvent(workspace.on('file-open', this.onFileOpen, this))
		this.addSettingTab(new SettingTab(this.app, this));
	}

	async onFileOpen(file: TFile) {
		if (!file || file.extension !== 'md')
      		return;

		if(this.settings.useFrontmatterHighlight) {
			const classifcation = this.app.metadataCache.getFileCache(file)?.frontmatter?.[this.settings.fronmatterAttribute]
			if (classifcation == this.settings.valueToHighlight) {
				this.highlightNote()
			} else {
				this.unhighlightNote()
			}
		} else if(this.settings.usePathHighlight) {
            if (this.checkPath(file.path, this.settings.pathToHighlight)) {
		        this.highlightNote()
            } else {
                this.unhighlightNote()
            }
        }
	}

	private highlightNote() {
		const titlebar = document.getElementsByClassName("titlebar")[0]
		titlebar.classList.add("myalert")
	}

	private unhighlightNote() {
			const titlebar = document.getElementsByClassName("titlebar")[0]
			titlebar.classList.remove("myalert")
	}

	private checkPath(currentPath: string, blacklistedPath: string): boolean {
		return currentPath.includes(blacklistedPath)
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
		let {containerEl} = this;
		
		containerEl.empty()

		new Setting(containerEl)
			.setName('check frontmatter')
			.setDesc('use frontmatter highlighting')
			.addToggle(toogle => {
				toogle
				.setValue(this.plugin.settings.useFrontmatterHighlight)
				.onChange(async _ => {
					this.plugin.settings.useFrontmatterHighlight = !this.plugin.settings.useFrontmatterHighlight
					await this.plugin.saveSettings()
					this.display()
				})
			})
		
		new Setting(containerEl)
			.setName('check path')
			.setDesc('use path highlighting')
			.addToggle(toogle => {
				toogle
				.setValue(this.plugin.settings.usePathHighlight)
				.onChange(async _ => {
					this.plugin.settings.usePathHighlight = !this.plugin.settings.usePathHighlight
					await this.plugin.saveSettings()
					this.display()
				})
		})

		if (this.plugin.settings.useFrontmatterHighlight) {
			this.addFrontMatterSettings(containerEl)
		}
        if (this.plugin.settings.usePathHighlight) {
            this.addPathHighlightSettings(containerEl)
        }

		
		
	}


    addPathHighlightSettings(container: HTMLElement): void {
        container.createEl('h3', {
            text: "Path Highlight Settings"
        })
        new Setting(container)
			.setName('Path')
			.setDesc('a path to highlight')
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.pathToHighlight)
				.onChange(async (value) => {
					this.plugin.settings.pathToHighlight = value
					await this.plugin.saveSettings()
				}))
    }

	addFrontMatterSettings(container: HTMLElement): void {
        container.createEl('h3', {
            text: "Frontmatter Settings"
        })
        new Setting(container)
			.setName('Attribute')
			.setDesc('the attribute in the frontmatter that indicates the visiblity')
			.addText(text => text
				.setPlaceholder('classification')
				.setValue(this.plugin.settings.fronmatterAttribute)
				.onChange(async (value) => {
					this.plugin.settings.fronmatterAttribute = value
					await this.plugin.saveSettings()
				}))
			
        new Setting(container)
			.setName('Value')
			.setDesc('the value that indicates public visibility')
			.addText(text => text
				.setPlaceholder('public')
				.setValue(this.plugin.settings.valueToHighlight)
				.onChange(async (value) => {
					this.plugin.settings.valueToHighlight = value
					await this.plugin.saveSettings()
				}))
		}
	}
}
