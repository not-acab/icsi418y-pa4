import "./icon.css";

/* Tinted icon: the svg is set as a mask so it follows the text color */
const Icon = ({ src }) => {
    const mask = `url(${JSON.stringify(src)})`;
    return <span className="icon" style={{ WebkitMaskImage: mask, maskImage: mask }} />;
};

export default Icon;