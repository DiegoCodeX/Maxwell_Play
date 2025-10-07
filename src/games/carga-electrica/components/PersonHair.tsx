import manPng from "@/assets/man.png"; // gracias al alias "@"

export default function PersonHair({
  hairRef, disabled,
}: { hairRef: React.RefObject<HTMLDivElement>; disabled: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[330px] h-[250px] mb-3">
        <img
          src={manPng}
          alt="Persona para frotar el globo"
          className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
        />
        <div
          ref={hairRef}
          title="Frota aquí"
          className="absolute cursor-pointer rounded-[60px]"
          style={{
            left: "50%", transform: "translateX(-50%)", top: "26px",
            width: "130px", height: "90px", background: "transparent",
            pointerEvents: disabled ? "none" : "auto",
          }}
        />
      </div>
      <div className="text-white font-bold text-2xl md:text-3xl">Frota con el cabello</div>
    </div>
  );
}
