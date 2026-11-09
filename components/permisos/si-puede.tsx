import { usePuede } from "@/hooks/use-permisos";
import { Accion } from "@/lib/type/permisos";
import { ReactNode } from "react";

export function SiPuede({ accion, children}: { accion: Accion, children : ReactNode}) {
    return usePuede(accion) ? <>{children}</> : null
}