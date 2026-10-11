const modules = import.meta.glob('./guides/*.json', { eager: true, import: 'default' });
export const guides = Object.values(modules).sort((a,b)=>a.number-b.number);
export const guideBySlug = new Map(guides.map(g=>[g.slug,g]));
export default guides;
