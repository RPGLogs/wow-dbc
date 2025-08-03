export type FileList = Record<number, string>;

export async function downloadFileList(version: string): Promise<FileList> {
  const res = await fetch(
    `https://wago.tools/api/files?version=${version}&format=json`,
  );

  return res.json();
}

export function cleanIconName(iconName: string): string {
  const fname = iconName.split("/").at(-1);
  return fname!.replace(".blp", ".jpg").replaceAll(" ", "-");
}
