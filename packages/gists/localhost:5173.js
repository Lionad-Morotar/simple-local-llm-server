// 展开所有菜单，以便搜索
async function openAllMenus() {
	const unOpenIcons = [...document.querySelectorAll('.arco-menu-icon-suffix:not(.is-open)')]

	for (const icon of unOpenIcons) {
    await new Promise(resolve => setTimeout(resolve, 100))
    icon.click()
	}
}
openAllMenus()