# VS Code Links

<a href="https://marketplace.visualstudio.com/items?itemName=yuns.links" target="__blank"><img src="https://img.shields.io/visual-studio-marketplace/v/yuns.links.svg?color=eee&amp;label=VS%20Code%20Marketplace&logo=visual-studio-code" alt="Visual Studio Marketplace Version" /></a>
<a href="https://kermanx.github.io/reactive-vscode/" target="__blank"><img src="https://img.shields.io/badge/made_with-reactive--vscode-%23007ACC?style=flat&labelColor=%23229863"  alt="Made with reactive-vscode" /></a>

Pursue better UX for project links

## Usage

1. Initialize current project related links resources like:

```jsonc
// .vscode/settings.json
{
  "links.resources": [
    {
      "url": "https://github.com/yunsii/vscode-links",
      "title": "GitHub Repo"
    }
    // ...
  ]
}
```

2. Open the [command palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette)

3. Select **Links Open ...**

4. Select the link you want to open by default browser 🎉

## Roadmap

- [ ] Support auto parse git repo web links
  - [ ] GitHub
  - [x] CODING

## License

[MIT](./LICENSE) License © 2024 [Yuns](https://github.com/yunsii)
