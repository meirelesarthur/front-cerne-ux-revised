import { Box, Image, useToken } from "@chakra-ui/react";

interface SvgImageProps {
  svgString: string;
  width?: string;
  height?: string;
  color: string;
}

export function SvgImage({ svgString, width, height, color }: SvgImageProps) {
  const changeSvgColor = (svg: string, color: string) => {
    const hexColor = useToken("colors", color);
    const coloredSvg = svg.replace(/<path/g, `<path fill="${hexColor}"`);
    return coloredSvg;
  };

  const encodedSvg = encodeURIComponent(changeSvgColor(svgString, color));

  return (
    <Box width={width} height={height}>
      <Image
        src={`data:image/svg+xml,${encodedSvg}`}
        alt="SVG Image"
        width="100%"
        height="100%"
        style={{ objectFit: "contain" }}
      />
    </Box>
  );
}
