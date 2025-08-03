export async function downloadFileList(version) {
    const res = await fetch(`https://wago.tools/api/files?version=${version}&format=json`);
    return res.json();
}
export function cleanIconName(iconName) {
    const fname = iconName.split("/").at(-1);
    return fname.replace(".blp", ".jpg").replaceAll(" ", "-");
}
