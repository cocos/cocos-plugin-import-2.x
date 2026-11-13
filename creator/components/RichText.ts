'use strict';
import { ImporterBase } from "../common/base";
import { compareVersion, getBlendFactor2DTo3D } from "../common/utlis";

export const RICHTEXT = {
    "__type__": "cc.RichText",
    "_name": "",
    "_objFlags": 0,
    "node": null,
    "_enabled": true,
    "__prefab": null,
    "_lineHeight": 40,
    "_string": "<color=#00ff00>Rich</color><color=#0fffff>Text</color>",
    "_horizontalAlign": 0,
    "_fontSize": 40,
    "_maxWidth": 0,
    "_fontFamily": "Arial",
    "_font": null,
    "_isSystemFontUsed": true,
    "_userDefinedFont": null,
    "_cacheMode": 0,
    "_imageAtlas": null,
    "_handleTouchEvent": true,
};

export class RichText {

    static create() {
        const source = JSON.parse(JSON.stringify(RICHTEXT));
        if (compareVersion(Editor.App.version, '3.8.1') >= 0) {
            source._fontColor = {
                "__type__": "cc.Color",
                "r": 255,
                "g": 255,
                "b": 255,
                "a": 255,
            };
        }
        return source;
    }

    static async migrate(index: number, json2D: any) {
        const source = RichText.create();
        const richText = json2D[index];
        for (let key in richText) {
            const value = richText[key];
            if (key === '__type__' || value === undefined || value === null) {
                continue;
            }
            if (key === 'node') {
                source.node = value;
                const node = json2D[value.__id__];
                if (source._fontColor && node && node._color) {
                    source._fontColor.r = node._color.r;
                    source._fontColor.g = node._color.g;
                    source._fontColor.b = node._color.b;
                    source._fontColor.a = node._color.a;
                }
            } else if (key === '_materials') {
                // for (let i = 0; i < value.length; ++i) {
                let material = value[0];
                if (material) {
                    material = {
                        __uuid__: await ImporterBase.getUuid(material.__uuid__),
                    };
                }
                source._customMaterial = material;
                // }
            } else if (key === '_srcBlendFactor') {
                source._srcBlendFactor = getBlendFactor2DTo3D(value);
            } else if (key === '_dstBlendFactor') {
                source._dstBlendFactor = getBlendFactor2DTo3D(value);
            } else {
                key = key.replace(/_N\$/, '_');
                if (value.__uuid__) {
                    value.__uuid__ = await ImporterBase.getUuid(value.__uuid__);
                }
                source[key] = value;
            }
        }
        return source;
    }

    static async apply(index: number, json2D: any, json3D: any) {
        const source = await RichText.migrate(index, json2D);
        json3D.splice(index, 1, source);
        return source;
    }
}
