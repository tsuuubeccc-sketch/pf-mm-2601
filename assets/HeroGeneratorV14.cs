using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Collections.Generic;

public class HeroGeneratorV14
{
    public static void Main(string[] args)
    {
        string outputPath = args.Length > 0 ? args[0] : "assets/images/hero_dark_grid.jpg";
        Generate(outputPath);
        Console.WriteLine("Successfully generated V14: " + outputPath);
    }

    public static void Generate(string outputPath)
    {
        int w = 1920;
        int h = 1080;

        using (Bitmap bmp = new Bitmap(w, h, PixelFormat.Format32bppArgb))
        using (Graphics g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.CompositingQuality = CompositingQuality.HighQuality;

            // =================================================================
            // 1. ベース暗闇背景（シームレスな深宇宙漆黒グラデーション #020409 〜 #050816）
            // =================================================================
            Rectangle rectFull = new Rectangle(0, 0, w, h);
            using (LinearGradientBrush bgBrush = new LinearGradientBrush(
                new Point(0, 0),
                new Point(0, h),
                Color.FromArgb(255, 2, 4, 10),       // 上部：漆黒 #02040A
                Color.FromArgb(255, 5, 9, 22)        // 下部：ダークネイビー #050916
            ))
            {
                g.FillRectangle(bgBrush, rectFull);
            }

            float vpX = 960f;
            float vpH = 480f; // 消失点・地平線の高さ

            // =================================================================
            // 2. 地平線（Horizon）の繊細なネオンビーム
            // =================================================================
            using (LinearGradientBrush beamBrush = new LinearGradientBrush(
                new Point(0, (int)vpH),
                new Point(w, (int)vpH),
                Color.FromArgb(0, 0, 240, 255),
                Color.FromArgb(0, 0, 240, 255)
            ))
            {
                ColorBlend cb = new ColorBlend(5);
                cb.Colors = new Color[] {
                    Color.FromArgb(0, 0, 240, 255),
                    Color.FromArgb(80, 16, 185, 129),
                    Color.FromArgb(160, 0, 240, 255),
                    Color.FromArgb(80, 168, 85, 247),
                    Color.FromArgb(0, 168, 85, 247)
                };
                cb.Positions = new float[] { 0.0f, 0.25f, 0.5f, 0.75f, 1.0f };
                beamBrush.InterpolationColors = cb;
                using (Pen beamPen = new Pen(beamBrush, 1.0f))
                {
                    g.DrawLine(beamPen, 0, vpH, w, vpH);
                }
            }

            // =================================================================
            // 3. 【最重要】リズムゲーム調 3Dパースペクティブ・アイソメトリックグリッド
            //    - 斜め縦方向に美しく収束するレーン線 ＆ 正確な3D透視方眼
            // =================================================================

            // A. 横方向グリッド線（指数パースペクティブ）
            int numRows = 32;
            float[] rowYs = new float[numRows + 1];

            for (int j = 0; j <= numRows; j++)
            {
                float t = j / (float)numRows;
                float depthExp = (float)Math.Pow(t, 2.4);
                rowYs[j] = (h + 30f) - depthExp * (h - vpH + 25f);
            }

            // 横線の描画
            for (int j = 0; j <= numRows; j++)
            {
                float curY = rowYs[j];
                if (curY < vpH + 4f) continue;

                float depthNorm = (curY - vpH) / (h - vpH); // 0 (奥) 〜 1 (手前)
                int alpha = (int)(12 + depthNorm * 65);
                float lineThick = 0.7f + depthNorm * 0.7f;

                Color rowColor;
                if (j % 4 == 0) rowColor = Color.FromArgb(alpha, 0, 240, 255);       // シアンアクセント
                else if (j % 4 == 2) rowColor = Color.FromArgb(alpha, 168, 85, 247); // パープルアクセント
                else rowColor = Color.FromArgb((int)(alpha * 0.65f), 56, 189, 248);  // スレートシアン

                using (Pen pRow = new Pen(rowColor, lineThick))
                {
                    g.DrawLine(pRow, 0, curY, w, curY);
                }
            }

            // B. 縦レーン収束線（音ゲーのレーンのように奥の消失点へ走る線）
            int totalLanes = 44;
            float bottomSpread = w * 1.8f;

            // 各交点の座標を保持する2次元配列 [lane, row]
            PointF[,] gridPoints = new PointF[totalLanes + 1, numRows + 1];

            for (int i = 0; i <= totalLanes; i++)
            {
                float t = (i / (float)totalLanes) - 0.5f; // -0.5 〜 +0.5
                float xBottom = vpX + t * bottomSpread;
                float xTop = vpX + t * 40f;

                for (int j = 0; j <= numRows; j++)
                {
                    float curY = rowYs[j];
                    float norm = (curY - vpH) / (h - vpH); // 0 (奥) 〜 1 (手前)
                    float curX = xTop + norm * (xBottom - xTop);
                    gridPoints[i, j] = new PointF(curX, curY);
                }

                // レーン描画
                float distCenter = Math.Abs(t);
                bool isGuide = (i == 0 || i == totalLanes || i == 6 || i == totalLanes - 6 || i == 14 || i == totalLanes - 14);
                bool isCenterLane = distCenter < 0.10f;

                int laneAlpha = isCenterLane ? 18 : (isGuide ? 135 : 50);

                Color laneCol;
                if (i % 6 == 0) laneCol = Color.FromArgb(laneAlpha, 0, 240, 255);       // ネオンシアン
                else if (i % 6 == 3) laneCol = Color.FromArgb(laneAlpha, 168, 85, 247); // ネオンパープル
                else if (i % 6 == 1 || i % 6 == 5) laneCol = Color.FromArgb(laneAlpha, 16, 185, 129); // エメラルド
                else laneCol = Color.FromArgb((int)(laneAlpha * 0.65f), 56, 189, 248);

                PointF pStart = new PointF(xTop, vpH + 2f);
                PointF pEnd = new PointF(xBottom, h + 30f);

                if (isGuide)
                {
                    // ガイドレール：外側グロー + 鮮明コア + 純白レーザー芯
                    using (Pen pGlow = new Pen(Color.FromArgb((int)(laneAlpha * 0.4f), laneCol.R, laneCol.G, laneCol.B), 3.0f))
                    using (Pen pCore = new Pen(laneCol, 1.1f))
                    using (Pen pWhite = new Pen(Color.FromArgb((int)(laneAlpha * 0.85f), 255, 255, 255), 0.55f))
                    {
                        g.DrawLine(pGlow, pStart, pEnd);
                        g.DrawLine(pCore, pStart, pEnd);
                        g.DrawLine(pWhite, pStart, pEnd);
                    }
                }
                else
                {
                    using (Pen pLane = new Pen(laneCol, 0.85f))
                    {
                        g.DrawLine(pLane, pStart, pEnd);
                    }
                }
            }

            // C. 3D透視フロアのダイアモンド対角線（真のアイソメトリック格子）
            using (Pen diagPen = new Pen(Color.FromArgb(18, 56, 189, 248), 0.7f))
            {
                // 右斜め対角線
                for (int diag = -numRows; diag <= totalLanes; diag += 2)
                {
                    List<PointF> linePts = new List<PointF>();
                    for (int j = 0; j <= numRows; j++)
                    {
                        int i = diag + (numRows - j);
                        if (i >= 0 && i <= totalLanes)
                        {
                            linePts.Add(gridPoints[i, j]);
                        }
                    }
                    if (linePts.Count > 1)
                    {
                        g.DrawLines(diagPen, linePts.ToArray());
                    }
                }

                // 左斜め対角線
                for (int diag = 0; diag <= totalLanes + numRows; diag += 2)
                {
                    List<PointF> linePts = new List<PointF>();
                    for (int j = 0; j <= numRows; j++)
                    {
                        int i = diag - (numRows - j);
                        if (i >= 0 && i <= totalLanes)
                        {
                            linePts.Add(gridPoints[i, j]);
                        }
                    }
                    if (linePts.Count > 1)
                    {
                        g.DrawLines(diagPen, linePts.ToArray());
                    }
                }
            }

            // D. 上部空間（Upper Space）：深宇宙に溶け込む極めて控えめな上層グリッド
            using (Pen topIsoPen = new Pen(Color.FromArgb(12, 56, 189, 248), 0.6f))
            {
                for (float x = -h; x <= w + h; x += 55f)
                {
                    g.DrawLine(topIsoPen, x, 0, x + vpH * 1.732f, vpH);
                    g.DrawLine(topIsoPen, x, 0, x - vpH * 1.732f, vpH);
                }
            }

            // =================================================================
            // 4. 【ノードとネットワークの局所配置（画面内に安全に収まる9箇所配置）】
            // =================================================================
            var spotNodes = new List<Tuple<float, float, int, float>>();

            Action<float, float, int, int, float> addExpandedSpot = (cx, cy, count, baseColorType, spread) =>
            {
                Random r = new Random((int)(cx * 37 + cy * 71));
                for (int i = 0; i < count; i++)
                {
                    float ox = (i == 0) ? 0 : (float)((r.NextDouble() - 0.5) * spread * 2);
                    float oy = (i == 0) ? 0 : (float)((r.NextDouble() - 0.5) * spread * 1.5);
                    float sz = (i == 0) ? 8.5f : (float)(5.8 + r.NextDouble() * 2.0);
                    int col = (i % 2 == 0) ? baseColorType : ((baseColorType + 1) % 4);
                    spotNodes.Add(Tuple.Create(cx + ox, cy + oy, col, sz));
                }
            };

            // 9箇所の安全配置（端から十分に内側へオフセット）
            addExpandedSpot(360f, 700f, 4, 0, 70f);   // 1. 左側中段レーン交点（シアン）
            addExpandedSpot(1560f, 690f, 4, 1, 70f);  // 2. 右側中段レーン交点（パープル）
            addExpandedSpot(260f, 920f, 4, 2, 75f);   // 3. 左手前フロア交点（エメラルド）
            addExpandedSpot(1660f, 910f, 4, 0, 75f);  // 4. 右手前フロア交点（シアン）
            addExpandedSpot(300f, 200f, 3, 0, 60f);   // 5. 左上サイド余白（シアン）
            addExpandedSpot(1620f, 210f, 3, 1, 60f);  // 6. 右上サイド余白（パープル）
            addExpandedSpot(960f, 980f, 3, 0, 45f);   // 7. 最下部中央手前（シアン・エメラルド）
            addExpandedSpot(200f, 480f, 4, 2, 65f);   // 8. 左側地平線サイド余白（エメラルド＆シアン）
            addExpandedSpot(1720f, 480f, 4, 1, 65f);  // 9. 右側地平線サイド余白（パープル＆シアン）

            // 局所エッジ（接続線）描画：外側グロー + 鮮明ネオンコア + 純白レーザー芯
            float maxSpotDist = 150f;
            for (int i = 0; i < spotNodes.Count; i++)
            {
                for (int j = i + 1; j < spotNodes.Count; j++)
                {
                    float dx = spotNodes[i].Item1 - spotNodes[j].Item1;
                    float dy = spotNodes[i].Item2 - spotNodes[j].Item2;
                    float dist = (float)Math.Sqrt(dx * dx + dy * dy);

                    if (dist < maxSpotDist)
                    {
                        float factor = 1.0f - (dist / maxSpotDist);
                        Color baseColor;
                        switch (spotNodes[i].Item3)
                        {
                            case 0: baseColor = Color.FromArgb(0, 240, 255); break;       // Cyan
                            case 1: baseColor = Color.FromArgb(192, 132, 252); break;     // Purple
                            case 2: baseColor = Color.FromArgb(52, 211, 153); break;      // Emerald
                            default: baseColor = Color.FromArgb(56, 189, 248); break;     // Sky
                        }

                        // 外側グロー
                        using (Pen pGlow = new Pen(Color.FromArgb((int)(factor * 100), baseColor.R, baseColor.G, baseColor.B), 4.2f))
                        // 鮮やかなネオン線（1.4px）
                        using (Pen pNeon = new Pen(Color.FromArgb((int)(factor * 240), baseColor.R, baseColor.G, baseColor.B), 1.4f))
                        // 純白レーザー芯（0.7px）
                        using (Pen pWhite = new Pen(Color.FromArgb((int)(factor * 225), 255, 255, 255), 0.7f))
                        {
                            g.DrawLine(pGlow, spotNodes[i].Item1, spotNodes[i].Item2, spotNodes[j].Item1, spotNodes[j].Item2);
                            g.DrawLine(pNeon, spotNodes[i].Item1, spotNodes[i].Item2, spotNodes[j].Item1, spotNodes[j].Item2);
                            g.DrawLine(pWhite, spotNodes[i].Item1, spotNodes[i].Item2, spotNodes[j].Item1, spotNodes[j].Item2);
                        }
                    }
                }
            }

            // ノード（点）描画
            foreach (var n in spotNodes)
            {
                Color nodeColor;
                switch (n.Item3)
                {
                    case 0: nodeColor = Color.FromArgb(0, 240, 255); break;
                    case 1: nodeColor = Color.FromArgb(192, 132, 252); break;
                    case 2: nodeColor = Color.FromArgb(52, 211, 153); break;
                    default: nodeColor = Color.FromArgb(125, 211, 252); break;
                }

                // 1. 周囲のネオングローハロー
                using (GraphicsPath path = new GraphicsPath())
                {
                    float r = n.Item4 * 3.4f;
                    path.AddEllipse(n.Item1 - r, n.Item2 - r, r * 2, r * 2);
                    using (PathGradientBrush pgb = new PathGradientBrush(path))
                    {
                        pgb.CenterColor = Color.FromArgb(160, nodeColor.R, nodeColor.G, nodeColor.B);
                        pgb.SurroundColors = new Color[] { Color.FromArgb(0, nodeColor.R, nodeColor.G, nodeColor.B) };
                        g.FillPath(pgb, path);
                    }
                }

                // 2. 発光外枠リング
                using (Pen ringPen = new Pen(Color.FromArgb(220, nodeColor.R, nodeColor.G, nodeColor.B), 1.3f))
                {
                    g.DrawEllipse(ringPen, n.Item1 - n.Item4 * 1.5f, n.Item2 - n.Item4 * 1.5f, n.Item4 * 3.0f, n.Item4 * 3.0f);
                }

                if (n.Item4 >= 8.0f)
                {
                    using (Pen outerRingPen = new Pen(Color.FromArgb(140, nodeColor.R, nodeColor.G, nodeColor.B), 1.0f))
                    {
                        g.DrawEllipse(outerRingPen, n.Item1 - n.Item4 * 2.1f, n.Item2 - n.Item4 * 2.1f, n.Item4 * 4.2f, n.Item4 * 4.2f);
                    }
                }

                // 3. 発光ボディ
                using (SolidBrush bodyBrush = new SolidBrush(Color.FromArgb(245, nodeColor.R, nodeColor.G, nodeColor.B)))
                {
                    g.FillEllipse(bodyBrush, n.Item1 - n.Item4 / 2f, n.Item2 - n.Item4 / 2f, n.Item4, n.Item4);
                }

                // 4. 純白のコアハイライト
                float coreRadius = Math.Max(2.4f, n.Item4 * 0.52f);
                using (SolidBrush coreBrush = new SolidBrush(Color.FromArgb(255, 255, 255, 255)))
                {
                    g.FillEllipse(coreBrush, n.Item1 - coreRadius / 2f, n.Item2 - coreRadius / 2f, coreRadius, coreRadius);
                }
            }

            // =================================================================
            // 5. グリッド交点上の微細クロスマーク（+）
            // =================================================================
            using (Pen crossPenCyan = new Pen(Color.FromArgb(140, 0, 240, 255), 0.9f))
            using (Pen crossPenPurple = new Pen(Color.FromArgb(130, 168, 85, 247), 0.9f))
            {
                PointF[] keyPoints = new PointF[]
                {
                    new PointF(460, 630), new PointF(1460, 630),
                    new PointF(360, 810), new PointF(1560, 810),
                    new PointF(300, 360), new PointF(1620, 360)
                };

                for (int i = 0; i < keyPoints.Length; i++)
                {
                    Pen cp = (i % 2 == 0) ? crossPenCyan : crossPenPurple;
                    g.DrawLine(cp, keyPoints[i].X - 5f, keyPoints[i].Y, keyPoints[i].X + 5f, keyPoints[i].Y);
                    g.DrawLine(cp, keyPoints[i].X, keyPoints[i].Y - 5f, keyPoints[i].X, keyPoints[i].Y + 5f);
                }
            }

            // =================================================================
            // 6. 浮遊微細データパーティクル
            // =================================================================
            Random rng = new Random(1002);
            for (int p = 0; p < 45; p++)
            {
                float px = rng.Next(60, w - 60);
                float py = rng.Next(60, h - 60);
                if (px > 480 && px < 1440 && py > 220 && py < 840) continue;

                int pAlpha = rng.Next(80, 200);
                float pSize = (float)rng.Next(2, 5);
                Color pColor = (rng.Next(2) == 0)
                    ? Color.FromArgb(pAlpha, 0, 240, 255)
                    : Color.FromArgb(pAlpha, 192, 132, 252);

                using (SolidBrush pBrush = new SolidBrush(pColor))
                {
                    g.FillEllipse(pBrush, px, py, pSize, pSize);
                }
            }

            // 最高画質JPEGとして保存（品質100）
            ImageCodecInfo jpgEncoder = GetEncoder(ImageFormat.Jpeg);
            EncoderParameters myEncoderParameters = new EncoderParameters(1);
            myEncoderParameters.Param[0] = new EncoderParameter(Encoder.Quality, 100L);
            bmp.Save(outputPath, jpgEncoder, myEncoderParameters);
        }
    }

    private static ImageCodecInfo GetEncoder(ImageFormat format)
    {
        ImageCodecInfo[] codecs = ImageCodecInfo.GetImageEncoders();
        foreach (ImageCodecInfo codec in codecs)
        {
            if (codec.FormatID == format.Guid)
            {
                return codec;
            }
        }
        return null;
    }
}
