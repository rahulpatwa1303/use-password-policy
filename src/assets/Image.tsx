export function Lock(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" {...props}>
      <path d="M 15 2 C 11.145666 2 8 5.1456661 8 9 L 8 11 L 6 11 C 4.895 11 4 11.895 4 13 L 4 25 C 4 26.105 4.895 27 6 27 L 24 27 C 25.105 27 26 26.105 26 25 L 26 13 C 26 11.895 25.105 11 24 11 L 22 11 L 22 9 C 22 5.2715823 19.036581 2.2685653 15.355469 2.0722656 A 1.0001 1.0001 0 0 0 15 2 z M 15 4 C 17.773666 4 20 6.2263339 20 9 L 20 11 L 10 11 L 10 9 C 10 6.2263339 12.226334 4 15 4 z" />
    </svg>
  );
}

export function Unlock(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" {...props}>
      <path d="M 15 2 C 11.145666 2 8 5.1456661 8 9 L 8 11 L 6 11 C 4.895 11 4 11.895 4 13 L 4 25 C 4 26.105 4.895 27 6 27 L 24 27 C 25.105 27 26 26.105 26 25 L 26 13 C 26 11.895 25.105 11 24 11 L 10 11 L 10 9 C 10 6.2263339 12.226334 4 15 4 C 17.184344 4 19.022854 5.3946656 19.708984 7.3339844 A 1.0001 1.0001 0 1 0 21.59375 6.6660156 C 20.631881 3.9473344 18.037656 2 15 2 z" />
    </svg>
  );
}

export function Cross({
  props,
  stroke = "#c1121f",
  width = "25px",
  height = "25px",
}: {
  props?: any;
  stroke?: string;
  width?: string;
  height?: string;
}) {
  return (
    <svg
      stroke={stroke}
      width={width}
      height={height}
      viewBox="0 0 24 24"
      id="cross"
      data-name="Line Color"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <line id="primary" x1="19" y1="19" x2="5" y2="5" {...props}></line>
      <line
        id="primary-2"
        data-name="primary"
        x1="19"
        y1="5"
        x2="5"
        y2="19"
        {...props}
      ></line>
    </svg>
  );
}
export function Tick({
  props,
  stroke = "#4c956c",
  width = "25px",
  height = "25px",
}: {
  props?: any;
  stroke?: string;
  width?: string;
  height?: string;
}) {
  return (
    <svg
      stroke={stroke}
      width={width}
      height={height}
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      {...props}
    >
      <polyline points="2.75 8.75,6.25 12.25,13.25 4.75" />
    </svg>
  );
}
