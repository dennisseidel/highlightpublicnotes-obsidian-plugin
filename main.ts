import { App, Plugin, PluginSettingTab, Setting, CachedMetadata } from 'obsidian';

interface PluginSettings {
	fronmatterAttribute: string;
	valueToHighlight: string,
}

const DEFAULT_SETTINGS: PluginSettings = {
	fronmatterAttribute: 'classification',
	valueToHighlight: 'public'
}

export default class HighlightpublicnotesPlugin extends Plugin {
	settings: PluginSettings;

	async onload() {
		await this.loadSettings();
		const { workspace } = this.app
		this.registerEvent(workspace.on('file-open', this.onFileOpen, this))
		this.addSettingTab(new SettingTab(this.app, this));
	}

	async onFileOpen(file: any) {
		if (!file || file.extension !== 'md')
      		return;
		const classifcation = await this.app.metadataCache.getFileCache(file)?.frontmatter?.[this.settings.fronmatterAttribute]
		const titlebar = document.getElementsByClassName("titlebar")[0]
		if (classifcation == this.settings.valueToHighlight) {
  			titlebar.classList.add("myalert");
		} else {
			titlebar.classList.remove("myalert")
		}
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
			.setName('Attribute')
			.setDesc('the attribute in the frontmatter that indicates the visiblity')
			.addText(text => text
				.setPlaceholder('classification')
				.setValue(this.plugin.settings.fronmatterAttribute)
				.onChange(async (value) => {
					this.plugin.settings.fronmatterAttribute = value
					await this.plugin.saveSettings()
				}))
		new Setting(containerEl)
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
