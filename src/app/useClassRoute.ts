import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ALL_CLASSES, CLASS_SUB_PAGES, ClassSubPage, SCREEN_PATHS, classPath, parseClassPath } from './screenRoutes';

interface ClassNavigationOptions {
  replace?: boolean;
  /** Trang sẽ quay về khi đóng trang con (ví dụ mở Tặng Pokémon từ Plaza). */
  returnTo?: string;
}

// Lớp đang chọn nằm trên URL (/class/<lớp>). Ngoài các trang lớp (Plaza, hồ sơ, cài đặt)
// app nhớ lớp mở gần nhất, giống bộ lọc lớp cũ. Cá Ngựa / Vòng quay / Tặng Pokémon là trang con của lớp.
export const useClassRoute = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { className: routeClassName, subPage: routeSubPage } = parseClassPath(location.pathname);
  const [rememberedClass, setRememberedClass] = useState<string>(ALL_CLASSES);

  useEffect(() => {
    if (routeClassName && routeClassName !== rememberedClass) setRememberedClass(routeClassName);
  }, [routeClassName]);

  const filterClass = routeClassName ?? rememberedClass;
  const routeReturnTo = (location.state as { returnTo?: string } | null)?.returnTo ?? null;

  const goToClassPage = (className: string, subPage?: ClassSubPage | null, options: ClassNavigationOptions = {}) => {
    navigate(classPath(className, subPage), {
      replace: options.replace,
      state: options.returnTo ? { returnTo: options.returnTo } : undefined
    });
  };

  const navigateTo = (path: string, options: { replace?: boolean } = {}) => navigate(path, { replace: options.replace });

  /** Ô chọn lớp: chọn một lớp thì sang trang lớp đó; chọn "Tất cả" thì về trang chọn lớp. */
  const setFilterClass = (value: string) => {
    if (value === ALL_CLASSES) navigate(SCREEN_PATHS.class);
    else goToClassPage(value);
  };

  return {
    filterClass,
    setFilterClass,
    routeClassName,
    routeSubPage,
    routeReturnTo,
    currentPath: location.pathname,
    goToClassPage,
    navigateTo,
    showLudoModal: routeSubPage === CLASS_SUB_PAGES.ludo,
    showLuckyWheelModal: routeSubPage === CLASS_SUB_PAGES.wheel,
    showGiftPokemonModal: routeSubPage === CLASS_SUB_PAGES.gift
  };
};
