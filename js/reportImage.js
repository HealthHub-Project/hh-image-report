const editMode = {
    select: 'select',
    move: 'move',
    pen: 'pen',
    ellipse: 'ellipse',
    line: 'line',
    text: 'text'
};

const baseLine = {
    top: 'top',
    bottom: 'bottom',
    middle: 'middle',
    alphabetic: 'alphabetic',
    Hanging: 'Hanging'
};

const textAlign = {
    start: 'start',
    end: 'end',
    left: 'left',
    right: 'right',
    center: 'center'
};

class ReportImage
{
    constructor(oCanvas) {

        h.setInit();

        this._g = oCanvas.getContext("2d");
        this._baseSize = new Size(350, 295);
        this._clientSize = new Size(oCanvas.width, oCanvas.height);
        this._imagePoint = new Point(0, 0);
        this._itemPoint = new Point(0, 0);
        this._scale = 1.0;
        this._g.scale(1.0, 1.0);
        this._editMode = editMode.select;
        this._fontSize = 15;
        this._fontName = "Arial";
        this._color = "#04B404"; //04B404,FB4BFB
        this._backImage = new Image();
        this._backImage.onload = () => this.onLoadImage();

        this._mouseStatus = new MouseStatus();

        this._selectedRect = new Rectangle();
    }

    setClientSize(nWidth, nHeight) {
        this._clientSize.width = nWidth;
        this._clientSize.height = nHeight;

        this.setResize();
    }

    onLoadImage() {
        this.draw();
    }

    onMouseDown(e) {
        this.mouse.setDown(e.button, e.x / this._scale, e.y / this._scale);

        if (this.editMode == editMode.move) {
            if (!this.selectedRect.contains(this.mouse.downPoint)) {
                this.editMode = editMode.select;
                this.draw();
            }
        }// if

    }

    onMouseMove(e) {
        this.mouse.setMove(e.x / this._scale, e.y / this._scale);

        if (this.mouse.isDown) {
            if (this.editMode == editMode.select) {
                this.setSelection();
                this.draw();
            }
            else if (this.editMode == editMode.move) {
                this.setMove();
                this.draw();
            }
        }
    }

    onMouseUp(e) {
        this.mouse.setUp(e.x / this._scale, e.y / this.scale);

        if (this.editMode == editMode.select) {
            this.setSelection();

            if (!this.selectedRect.isEmpty()) {
                this.editMode = editMode.move;
            }
        }
        else if (this.editMode == editMode.move) {
            this.setSelection();
        }

        this.draw();
    }

    setSelection() {
        if (this.editMode == editMode.select) {

            this.selectedRect.clear();

            if (typeof this._drawItems === "object" && typeof this._drawItems.items === "object" )
            {
                let rcSel = this.mouse.getMoveRect();

                //console.log(rcSel);

                //h.drawText(this.g, rcSel.toString(), 10, 40, "blue");

                for (let i = 0; i < this._drawItems.items.length; i++) {
                    let oItem = this._drawItems.items[i];
                    let rcItem = oItem.rect;

                    if (rcItem.x > rcSel.x && rcItem.y > rcSel.y && rcItem.right < rcSel.right && rcItem.bottom < rcSel.bottom) {
                        oItem.selected = true;

                        this.selectedRect.addBound(rcItem);
                    }// if
                    else {
                        oItem.selected = false;
                    }
                }// for i
            }
        }// if
    }

    setMove() {
        if (this.editMode == editMode.move) {
            let ptDown = this.mouse.downPoint;
            let ptMove = this.mouse.movePoint;

            let ptDiff = new Point(ptMove.x - ptDown.x, ptMove.y - ptDown.y);

            if (!ptDiff.isEmpty()) {
                this.selectedRect.clear();

                for (let i = 0; i < this._drawItems.items.length; i++) {
                    let oItem = this._drawItems.items[i];

                    if (oItem.selected) {

                        for (let j = 0; j < oItem.points.length; j++) {
                            let ptXY = oItem.points[j];

                            ptXY.x = parseFloat(ptXY.x) + parseFloat(ptDiff.x);
                            ptXY.y = parseFloat(ptXY.y) + parseFloat(ptDiff.y);
                        }// for j
                    }// if
                }// for i

                this.mouse.downPoint.x = ptMove.x;
                this.mouse.downPoint.y = ptMove.y;
            }
        }// if
    }

    setInit(sStudyDesc, joItems) {

        if (h.isEmpty(joItems) || h.isEmpty(joItems.backgroundImage)) {
            sStudyDesc = sStudyDesc.toLowerCase();
        }
        else {
            sStudyDesc = joItems.backgroundImage;
        }

        if (sStudyDesc.indexOf("trus_res") > -1)
        {
            this.setBackgroundImage(new Size(327, 425), imageFile.trusRes);
            sStudyDesc = "trus_res";
        }
        else if (sStudyDesc.indexOf("thyroid") > -1)
        {
            this.setBackgroundImage(new Size(326, 340), imageFile.trusRes);
            sStudyDesc = "thyroid";
        }
        else if (sStudyDesc.indexOf("breast") > -1)
        {
            this.setBackgroundImage(new Size(279, 196), imageFile.breast);
            sStudyDesc = "breast";
        }
        else if (sStudyDesc.indexOf("mammo") > -1)
        {
            this.setBackgroundImage(new Size(279, 196), imageFile.breast);
            sStudyDesc = "mammo";
        }
        else {
            this.setBackgroundImage(new Size(350, 295), "");
            sStudyDesc = "";
        }

        if (h.isEmpty(joItems) || h.isEmpty(joItems.items))
        {
            this._drawItems = JSON.parse('{"backgroundImage": "", "items": []');
        }
        else {
            this._drawItems = joItems;
        }

        this._drawItems.backgroundImage = sStudyDesc;

        this.setDrawAttribute(this._drawItems.items);
    }

    setBackgroundImage(szImg, sImgData) {
        this._baseSize = szImg;
        this._backImage.src = sImgData;

        this.setResize();
    }

    setDrawAttribute(aoItems) {
        if (aoItems != null && aoItems.length > 0) {
            for (let i = 0; i < aoItems.length; i++) {
                let oItem = aoItems[i];

                oItem.rect = new Rectangle();
                oItem.selected = false;

                let aoItems2 = oItem.items;

                if (aoItems2 != "undefined" && aoItems2 != null) {
                    if (aoItems2.length > 0) {
                        this.setDrawAttribute(aoItems2);
                    }// if
                }// if

            }// for i
        }
    }

    setResize() {
        let szBase = this._baseSize;
        let szClient = this._clientSize;
        let szDiff = new Size(szBase.width - szClient.width, szBase.height - szClient.height);

        if (szDiff.width > szDiff.height) {
            this.scale = (szBase.width - szDiff.width) / szBase.width;
        }
        else {
            this.scale = (szBase.height - szDiff.height) / szBase.height;
        }

        this.setSelection();

        this.draw();
    }

    draw()
    {
        this.g.clearRect(0, 0, this._clientSize.width, this._clientSize.height);

        this.drawBackground();

        let rcClient = new Rectangle(0, 0, this._clientSize.width, this._clientSize.height);

        rcClient.x = rcClient.x + this.imagePoint.x;
        rcClient.y = rcClient.y + this.imagePoint.y;

        if (typeof this._drawItems === "object" && typeof this._drawItems.items === "object" )
        {
            this.drawItems(this._drawItems.items, rcClient);
        }

        this.drawSelection(rcClient);

        h.drawError(this._Errors);
        this.drawDebug();
    }

    drawSelection(rcClient) {
        if (this.editMode == editMode.select)
        {
            if (this.mouse.isDown) {
                let rcMove = this.mouse.getMoveRect();
                h.drawSelect(this.g, rcMove.x, rcMove.y, rcMove.width, rcMove.height);
            }
        }
        else if (this.editMode == editMode.move) {
            let rcMove = new Rectangle();

            rcMove.x = this.selectedRect.x;
            rcMove.y = this.selectedRect.y;
            rcMove.width = this.selectedRect.width;
            rcMove.height = this.selectedRect.height;

            // rcMove.x = rcMove.x + rcClient.x;
            // rcMove.y = rcMove.y + rcClient.y;

            h.drawMove(this.g, rcMove.x, rcMove.y, rcMove.width, rcMove.height);
        }
    }

    drawItems(aoItems, rcClient) {
        if (!h.isEmpty(aoItems)) {
            if (this.editMode == editMode.move) {
                this.selectedRect.clear();
            }

            for (let i = 0; i < aoItems.length; i++) {
                let oItem = aoItems[i];

                this.drawItem(oItem, rcClient);

                if (oItem.selected) {
                    if (this.editMode == editMode.move) {
                        let rcItem = oItem.rect;

                        this.selectedRect.addBound(rcItem);
                    }// if
                }
            }// for i
        }// if
    }

    drawItem(oItem, rcClient) {
        if (!h.isEmpty(oItem)) {
            let rcClient2 = new Rectangle(0, 0, 0, 0);

            let sStyle = "";
            sStyle = oItem.style;

            if (sStyle == "ellipse") {
                if (oItem.points.length > 1) {
                    let oPoint1 = oItem.points[0];
                    let oPoint2 = oItem.points[1];

                    let n1x = Number.parseInt(oPoint1.x);
                    let n1y = Number.parseInt(oPoint1.y);
                    let n2x = Number.parseInt(oPoint2.x);
                    let n2y = Number.parseInt(oPoint2.y);

                    let rcItem = new Rectangle(0, 0, 0, 0);
                    rcItem.x = Math.min(n1x, n2x);
                    rcItem.y = Math.min(n1y, n2y);
                    rcItem.width = Math.max(n1x, n2x) - rcItem.x;
                    rcItem.height = Math.max(n1y, n2y) - rcItem.y;

                    rcItem.x = rcItem.x + rcClient.x;
                    rcItem.y = rcItem.y + rcClient.y;

                    oItem.rect = rcItem;

                    rcClient2.x = rcItem.x;
                    rcClient2.y = rcItem.y;
                    rcClient2.width = rcItem.width;
                    rcClient2.height = rcItem.height;

                    if (oItem.selected) {
                        this.g.save();

                        this.g.shadowColor = "#898";
                        this.g.shadowBlur = 5;
                        this.g.shadowOffsetX = 5;
                        this.g.shadowOffsetY = 5;

                        h.drawEllipse(this.g, rcItem.x, rcItem.y, rcItem.width, rcItem.height, "#FB4BFB");

                        this.g.restore();
                    }
                    else {
                        h.drawEllipse(this.g, rcItem.x, rcItem.y, rcItem.width, rcItem.height, this._color);
                    }

                }
            }
            else if (sStyle == "text") {
                if (oItem.points.length > 1 && !h.isEmpty(oItem.value)) {
                    let oPoint1 = oItem.points[0];
                    let oPoint2 = oItem.points[1];

                    let n1x = Number.parseInt(oPoint1.x);
                    let n1y = Number.parseInt(oPoint1.y);
                    let n2x = Number.parseInt(oPoint2.x);
                    let n2y = Number.parseInt(oPoint2.y);

                    n1x = n1x + rcClient.x;
                    n1y = n1y + rcClient.y;

                    let sValue = oItem.value;
                    let rcDraw = new Rectangle();

                    if (oItem.selected) {

                        this.g.save();

                        this.g.shadowColor = "#898";
                        this.g.shadowBlur = 5;
                        this.g.shadowOffsetX = 5;
                        this.g.shadowOffsetY = 5;

                        rcDraw = h.drawText(this.g, sValue, n1x, n1y, "#FB4BFB");

                        this.g.restore();
                    }
                    else {
                        rcDraw = h.drawText(this.g, sValue, n1x, n1y, this._color);
                    }

                    oItem.rect = rcDraw;
                }
            }
            else if (sStyle == "line") {
                if (oItem.points.length > 1) {
                    let oPoint1 = oItem.points[0];
                    let oPoint2 = oItem.points[1];

                    let n1x = Number.parseInt(oPoint1.x);
                    let n1y = Number.parseInt(oPoint1.y);
                    let n2x = Number.parseInt(oPoint2.x);
                    let n2y = Number.parseInt(oPoint2.y);

                    n1x = n1x + rcClient.x;
                    n1y = n1y + rcClient.y;
                    n2x = n2x + rcClient.x;
                    n2y = n2y + rcClient.y;

                    let rcDraw = new Rectangle();
                    rcDraw.x = n1x;
                    rcDraw.y = n1y;
                    rcDraw.right = n2x;
                    rcDraw.bottom = n2y;

                    oItem.rect = rcDraw;

                    this.g.beginPath();
                    this.g.moveTo(n1x, n1y);
                    this.g.lineTo(n2x, n2y);
                    this.g.closePath();

                    this.g.save();

                    if (oItem.selected) {

                        this.g.shadowColor = "#898";
                        this.g.shadowBlur = 5;
                        this.g.shadowOffsetX = 5;
                        this.g.shadowOffsetY = 5;

                        this.g.strokeStyle = "#FB4BFB";
                    }
                    else {
                        this.g.strokeStyle = this._color;
                    }

                    this.g.stroke();

                    this.g.restore();
                }
            }
            else if (sStyle == "pen") {

                let rcDraw = new Rectangle(99999, 99999, 0, 0);

                if (oItem.points.length > 0) {
                    for (let i = 0; i < oItem.points.length; i++) {
                        if (i) {
                            let oPoint1 = oItem.points[i-1];
                            let oPoint2 = oItem.points[i];

                            let n1x = Number.parseInt(oPoint1.x);
                            let n1y = Number.parseInt(oPoint1.y);
                            let n2x = Number.parseInt(oPoint2.x);
                            let n2y = Number.parseInt(oPoint2.y);

                            n1x = n1x + rcClient.x;
                            n1y = n1y + rcClient.y;
                            n2x = n2x + rcClient.x;
                            n2y = n2y + rcClient.y;

                            rcDraw.x = Math.min(rcDraw.x, n1x);
                            rcDraw.x = Math.min(rcDraw.x, n2x);
                            rcDraw.y = Math.min(rcDraw.y, n1y);
                            rcDraw.y = Math.min(rcDraw.y, n2y);

                            rcDraw.right = Math.max(rcDraw.right, n1x);
                            rcDraw.right = Math.max(rcDraw.right, n2x);
                            rcDraw.bottom = Math.max(rcDraw.bottom, n1y);
                            rcDraw.bottom = Math.max(rcDraw.bottom, n2y);

                            oItem.rect = rcDraw;

                            this.g.save();

                            this.g.beginPath();
                            this.g.moveTo(n1x, n1y);
                            this.g.lineTo(n2x, n2y);
                            this.g.closePath();

                            if (oItem.selected) {
                                this.g.shadowColor = "#898";
                                this.g.shadowBlur = 5;
                                this.g.shadowOffsetX = 5;
                                this.g.shadowOffsetY = 5;

                                this.g.strokeStyle = "#FB4BFB";
                            }
                            else {
                                this.g.strokeStyle = this._color;
                            }

                            this.g.stroke();

                            this.g.restore();
                        }
                    }// for i
                }
            }

            let aoItems = oItem.items;

            if (aoItems != "undefined" && aoItems != null) {
                if (aoItems.length > 0) {
                    this.drawItems(oItem.items, rcClient2);
                }// if
            }// if
        }// if
    }

    drawBackground() {
        let rcImage = new Rectangle(0, 0, this._baseSize.width, this._baseSize.height);
        let rcClient = new Rectangle(0, 0, this._clientSize.width / this.scale, this._clientSize.height / this.scale);

        if (rcImage.width != rcClient.width) {
            rcImage.x = ((rcClient.width - rcImage.width) / 2);
        }

        if (rcImage.height != rcClient.height) {
            rcImage.y = ((rcClient.height - rcImage.height) / 2);
        }

        this.imagePoint = rcImage.location;

        if (rcImage.width > rcImage.height) {
            this.itemPoint.x = Math.abs(rcImage.width - rcImage.height) * 3 + (Math.abs(rcImage.width - rcImage.height) / 2);
            this.itemPoint.y = 0;
        }
        else {
            this.itemPoint.x = 0;
            this.itemPoint.y = Math.abs(rcImage.width - rcImage.height) * 3 + (Math.abs(rcImage.width - rcImage.height) / 2);
        }

        this.g.drawImage(this._backImage, rcImage.x, rcImage.y, rcImage.width, rcImage.height);
        // this.g.strokeStyle = "red";
        // this.g.strokeRect(rcImage.x, rcImage.y, rcImage.width, rcImage.height);
    }

    drawDebug() {
        let rcDraw = new Rectangle(0, 10, 0, 0);

        rcDraw = h.drawText(this.g, this.scaleText, 10, rcDraw.bottom, "red", 20, "", "bold");
        rcDraw = h.drawText(this.g, this.editMode, 10, rcDraw.bottom, "red", 20, "", "");


    }

    get mouse() {
        return this._mouseStatus;
    }

    set mouse(oMouseStatus) {
        this._mouseStatus = oMouseStatus;
    }

    getFont() {
        return "".concat(this._fontSize, "px ", this._fontName);
    }

    get scaleText() {
        return Math.trunc(this.scale * 100) + "%";
    }

    get scale() {
        return this._scale;
    }

    set scale(nScale) {
        this._scale = nScale;

        if (this.g !== "undefine") {
            this.g.scale(this._scale, this._scale);
        }
    }

    get imagePoint() {
        return this._imagePoint;
    }

    set imagePoint(oImagePoint) {
        this._imagePoint = oImagePoint;
    }

    get itemPoint() {
        return this._itemPoint;
    }

    set itemPoint(oItemPoint) {
        this._itemPoint = oItemPoint;
    }

    get g() {
        return this._g;
    }

    set g(oContext) {
        this._g = oContext;
    }

    get editMode() {
        return this._editMode;
    }

    set editMode(eEditMode) {
        this._editMode = eEditMode;
    }

    get selectedRect() {
        return this._selectedRect;
    }

    set selectedRect(oRect) {
        this._selectedRect = oRect;
    }
} // class

// **********************
// h class
// **********************
class h {

    static setInit() {
        this._Errors = [];
        this._TextLineSpacing = 2;
    }

    static get fontSize() {
        return 15;
    }

    static get fontName() {
        return "Arial";
    }

    static get textLineSpacing() {
        return this._TextLineSpacing;
    }

    static set textLineSpacing(nSpacing) {
        this._TextLineSpacing = nSpacing;
    }

    //////////////////////////
    //typeof 연산자는 형식 정보를 문자열로 반환합니다. typeof는 "number", "string", "boolean", "object", "function" 및 "undefined"의 6가지 값을 반환할 수 있습니다.
    //////////////////////////
    static isEmpty(sText) {
        return typeof sText === "undefined" || sText === null || sText == "";
        //return typeof sText === "undefined" || sText === null || sText.match(/^ *$/) !== null;
    }

    static isNumber(sNumber) {
        if (h.isEmpty(sNumber)) {
            return false
        } else {
            return !isNaN(parseFloat(sNumber)) && isFinite(sNumber);
        }
    }

    //////////////////////////
    // context.font="italic small-caps bold 12px arial";
    // normal|italic|oblique|small-caps|bold|bolderlighter|100|200|300|400|500|600|700|800|900
    //////////////////////////
    static getFont(nSize, sName, sStyle) {
        let sRet = "";

        sRet = sRet.concat(nSize, "px ", sName);

        if (!h.isEmpty(sStyle)) {
            sRet = sRet.concat(sStyle, " ", sRet);
        }

        return sRet;
    }

    static drawSelect(oCtx, nX, nY, nWidth, nHeight, sLineColor = "rgba(0,0,255,1)", sBackColor = "rgba(0,0,255,0.1)") {

        oCtx.save();

        let nLineWidth = oCtx.lineWidth;
        oCtx.lineWidth = 1;
        oCtx.scale(1.0, 1.0);

        oCtx.beginPath();

        // oCtx.strokeStyle = "rgba(50,50,50,0.5)";
        // oCtx.strokeRect(nX + 2, nY + 2, nWidth, nHeight);

        oCtx.fillStyle = sBackColor;
        oCtx.fillRect(nX, nY, nWidth, nHeight);

        oCtx.strokeStyle = sLineColor;

        oCtx.shadowColor = "#898";
        oCtx.shadowBlur = 20;
        oCtx.shadowOffsetX = 10;
        oCtx.shadowOffsetY = 10;

        oCtx.strokeRect(nX, nY, nWidth, nHeight);

        // let rc1 = new Rectangle(nX, nY, nWidth, nHeight);
        // this.drawText(oCtx, rc1.toString(), nX, nY, sLineColor, "", "", "", true, textAlign.start, baseLine.bottom);

        oCtx.closePath();

        oCtx.lineWidth = nLineWidth;

        oCtx.restore();
    }

    static drawMove(oCtx, nX, nY, nWidth, nHeight, sLineColor = "black") {

        if (h.isEmpty(sLineColor)) {
            sLineColor = "black";
        }

        let nLineWidth = oCtx.lineWidth;
        oCtx.save();

        oCtx.beginPath();

        oCtx.lineWidth = 1;
        oCtx.setLineDash([3,2]);

        oCtx.strokeStyle = sLineColor;

        oCtx.shadowColor = "#898";
        oCtx.shadowBlur = 20;
        oCtx.shadowOffsetX = 10;
        oCtx.shadowOffsetY = 10;

        oCtx.strokeRect(nX, nY, nWidth, nHeight);

        oCtx.closePath();

        oCtx.lineWidth = nLineWidth;

        oCtx.restore();

        oCtx.lineWidth = nLineWidth;
    }

    static drawEllipse(oCtx, nX, nY, nWidth, nHeight, sColor = "black") {
        let PI2=Math.PI*2;
        let ratio=nHeight/nWidth;
        let radius=Math.max(nWidth,nHeight)/2;
        let increment = 1 / radius;
        let cx = nX + nWidth/2;
        let cy = nY + nHeight/2;

        oCtx.beginPath();
        let nX2 = cx + radius * Math.cos(0);
        let nY2 = cy - ratio * radius * Math.sin(0);
        oCtx.lineTo(nX2,nY2);

        for(let radians=increment; radians<PI2; radians+=increment){
            let nX3 = cx + radius * Math.cos(radians);
            let nY3 = cy - ratio * radius * Math.sin(radians);
            oCtx.lineTo(nX3,nY3);
        }

        oCtx.closePath();
        oCtx.strokeStyle = sColor;
        oCtx.stroke();
    }

    static drawText(oCtx, sText, nX = 0, nY = 0, sColor = "black",
                    nFontSize = h.fontSize, sFontName = h.fontName, sFontStyle = "normal", bFill = true,
                    eTextAlign = textAlign.start, eBaseLine = baseLine.top) {
        let rcDraw = new Rectangle(nX, nY, 1, nFontSize);

        if (arguments.length >= 4) {
            if (typeof oCtx === "object" && !h.isEmpty(sText) && h.isNumber(nX) && h.isNumber(nY))
            {
                try {

                    if (nFontSize == 0) {
                        nFontSize = h.fontSize;
                    }

                    if (sFontName == "") {
                        sFontName = h.fontName;
                    }

                    oCtx.textAlign = eTextAlign;
                    oCtx.textBaseline = eBaseLine;
                    oCtx.font = h.getFont(nFontSize, sFontName);

                    let sText2 = "";
                    sText2 = "" + sText;
                    sText2 = sText2.replace("\r", "\n");
                    let asText = sText2.split("\n");

                    for (let i = 0; i < asText.length; i++) {
                        let sLine = "";
                        sLine = asText[i];

                        if (bFill) {
                            oCtx.fillStyle = sColor;
                            oCtx.fillText(sLine, nX, nY);
                        }
                        else {
                            oCtx.strokeStyle = sColor;
                            oCtx.strokeText(sLine, nX, nY);
                        }

                        rcDraw.width = Math.max(oCtx.measureText(sLine, nX, nY).width, rcDraw.width);

                        nY = nY + nFontSize + h.textLineSpacing;
                        rcDraw.bottom = nY;

                    }// for
                }
                catch (e) {
                    //private error
                }
            }
            else {
                //print error
            }
        }// if
        else {
            //print error
        }

        return rcDraw;
    }

    static addError(sSubject, sDetail, sName) {

        let oErr = new Error();

        oErr.subject = sSubject;
        oErr.detail = sDetail;
        oErr.name = sName;

        this._Errors.push(oErr);

        return this._Errors.length;
    }

    static drawError(oCtx) {
        let nY = 5;

        for (let i = 0; i < this._Errors.length; i++) {
            let oErr = this._Errors[i];

            nY = h.drawText(oCtx, oErr.getString(), 5, nY, "red", 0, "", "italic", true);
        }
    }

}

class MouseStatus {
    constructor() {
        this._isDown = false;
        this._upPoint = new Point(0, 0);
        this._downPoint = new Point(0, 0);
        this._movePoint = new Point(0, 0);
        this._button = -1;
    }

    setDown(nButton, nX, nY) {
        this._isDown = true;
        this._button = nButton;
        this._downPoint.x = nX;
        this._downPoint.y = nY;
    }

    setUp(nX, nY) {
        this._upPoint.x = nX;
        this._upPoint.y = nY;
        this._isDown = false;
    }

    setMove(nX, nY) {
        this._movePoint.x = nX;
        this._movePoint.y = nY;
    }

    getMoveRect() {
        let rcMove = new Rectangle(0, 0, 0, 0);

        rcMove.x = Math.min(this._downPoint.x, this._movePoint.x);
        rcMove.y = Math.min(this._downPoint.y, this._movePoint.y);
        rcMove.width = Math.abs(this._downPoint.x - this._movePoint.x);
        rcMove.height = Math.abs(this._downPoint.y - this._movePoint.y);

        return rcMove;
    }

    get isDown() {
        return this._isDown;
    }

    get downPoint() {
        return this._downPoint;
    }

    set downPoint(ptDown) {
        this._downPoint = ptDown;
    }

    get movePoint() {
        return this._movePoint;
    }

    set movePoint(ptMove) {
        this._movePoint = ptMove;
    }

}

class Error {
    constructor(sSubject, sDetail, sName) {

        this._Subject = "";
        this._Detail = "";
        this._Name = "";

        if (!h.isEmpty(sSubject)) {
            this._Subject = sSubject;
        }

        if (!h.isEmpty(sDetail)) {
            this._Detail = sDetail;
        }

        if (!h.isEmpty(sName)) {
            this._Name = sName;
        }
    }

    get subject() {
        return this._Subject;
    }

    set subject(sSubject) {
        this._Subject = sSubject;
    }

    get detail() {
        return this._Detail;
    }

    set detail(sDetail) {
        this._Detail = sDetail;
    }

    get name() {
        return this._Name;
    }

    set name(sName) {
        this._Name = sName;
    }

    getString() {
        let sRet = "";

        sRet = sRet.concat("[Subject : ", this._Subject, "]", "\r\n", "*Method : ", this._Name, "\r\n", "-----Detail-----\r\n", this._Detail, "\r\n\r\n");

        return sRet;
    }

}

class Rectangle
{
    constructor(nX, nY, nW, nH)
    {
        this._nX = 0;
        this._nY = 0;
        this._nW = 0;
        this._nH = 0;

        if (typeof nX !== "undefined" && nX !== null && nX !== "") {
            if (!isNaN(parseFloat(nX)) && isFinite(nX))
            {
                this._nX = parseFloat(nX);
            }
        }

        if (typeof nY !== "undefined" && nY !== null && nY !== "") {
            if (!isNaN(parseFloat(nY)) && isFinite(nY))
            {
                this._nY = parseFloat(nY);
            }
        }

        if (typeof nW !== "undefined" && nW !== null && nW !== "") {
            if (!isNaN(parseFloat(nW)) && isFinite(nW))
            {
                this._nW = parseFloat(nW);
            }
        }

        if (typeof nH !== "undefined" && nH !== null && nH !== "") {
            if (!isNaN(parseFloat(nH)) && isFinite(nH))
            {
                this._nH = parseFloat(nH);
            }
        }

    }

    get x() {
        return this._nX;
    }

    set x(nX) {
        this._nX = nX;
    }

    get y() {
        return this._nY;
    }

    set y(nY) {
        this._nY = nY;
    }

    get location() {
        return new Point(this._nX, this._nY);
    }

    set location(oLocation) {
        this._nX = oLocation.x;
        this._nY = oLocation.y;
    }

    get width() {
        return this._nW;
    }

    set width(nWidth) {
        this._nW = nWidth;
    }

    get height() {
        return this._nH;
    }

    set height(nHeight) {
        this._nH = nHeight;
    }

    get size() {
        return new Size(this._nW, this._nH);
    }

    set size(oSize) {
        this._nW = oSize.width;
        this._nH = oSize.height;
    }

    get bottom() {
        return this._nY + this._nH;
    }

    set bottom(nBottom) {
        let nH = 0;

        nH = nBottom - this._nY;

        if (nH < 0) {
            this._nH = 0;
        }
        else {
            this._nH = nH;
        }
    }

    get right() {
        return this._nX + this._nW;
    }

    set right(nRight) {
        let nW = 0;

        nW = nRight - this._nX;

        if (nW < 0) {
            this._nW = 0;
        }
        else {
            this._nW = nW;
        }
    }

    isEmpty() {
        if (this.x == 0 && this.y == 0 && this.width == 0 && this.height == 0) {
            return true;
        }
        else {
            return false;
        }
    }

    addBound(rcItem) {

        if (this.x == 0)
        {
            this.x = rcItem.x;
        }
        else {
            this.x = Math.min(this.x, rcItem.x);
        }

        if (this.y == 0)
        {
            this.y = rcItem.y;
        }
        else {
            this.y = Math.min(this.y, rcItem.y);
        }

        this.right = Math.max(this.right, rcItem.right);
        this.bottom = Math.max(this.bottom, rcItem.bottom);
    }

    clear() {
        this._nX = 0;
        this._nY = 0;
        this._nW = 0;
        this._nH = 0;
    }

    contains(pXY) {
        if (this.x <= pXY.x && this.y <= pXY.y && this.right >= pXY.x && this.bottom >= pXY.y) {
            return true;
        }// if
        else {
            return false;
        }
    }

    toString() {
        return "".concat(this._nX, ",", this._nY, ",", this._nW, ",", this._nH);
    }

}

class Size
{
    constructor(nWidth, nHeight)
    {
        this._nWidth = 0;
        this._nHeight = 0;

        if (typeof nWidth !== "undefined" && nWidth !== null && nWidth != "") {
            if (!isNaN(parseFloat(nWidth)) && isFinite(nWidth))
            {
                this._nWidth = parseFloat(nWidth);
            }
        }

        if (typeof nHeight !== "undefined" && nHeight !== null && nHeight != "") {
            if (!isNaN(parseFloat(nHeight)) && isFinite(nHeight))
            {
                this._nHeight = parseFloat(nHeight);
            }
        }
    }

    get width() {
        return this._nWidth;
    }

    set width(nWidth) {
        this._nWidth = nWidth;
    }

    get height() {
        return this._nHeight;
    }

    set height(nHeight) {
        this._nHeight = nHeight;
    }
}

class Point
{
    constructor(nX, nY)
    {
        this._nX = 0;
        this._nY = 0;

        if (typeof nX !== "undefined" && nX !== null && nX != "") {
            if (!isNaN(parseFloat(nX)) && isFinite(nX))
            {
                this._nX = parseFloat(nX);
            }
        }

        if (typeof nY !== "undefined" && nY !== null && nY != "") {
            if (!isNaN(parseFloat(nY)) && isFinite(nY))
            {
                this._nY = parseFloat(nY);
            }
        }
    }

    get x() {
        return this._nX;
    }

    set x(nX) {
        this._nX = nX;
    }

    get y() {
        return this._nY;
    }

    set y(nY) {
        this._nY = nY;
    }

    isEmpty() {
        if (this.x == 0 && this.y == 0) {
            return true;
        }
        else {
            return false;
        }
    }
}