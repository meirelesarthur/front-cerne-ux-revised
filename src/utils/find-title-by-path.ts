import { SidebarCategory } from "@/@types/sidbar";


export function findTitleByPath(path: string, sidebar: SidebarCategory[],): string | null {
  for (const item of sidebar) {

    if (item.type === 'link' && item.path === path) {
      return item.title;
    }


    if (item.childrens && item.childrens.length > 0) {
      const title = findTitleByPath(path, item.childrens as SidebarCategory[],);
      if (title) {
        return title;
      }
    }
  }

  return null;
}
