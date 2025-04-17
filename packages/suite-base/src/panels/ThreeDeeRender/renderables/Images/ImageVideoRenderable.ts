import { ImageRenderable, ImageUserData } from "./ImageRenderable";
import { IRenderer } from "../../IRenderer";

export class ImageVideoRenderable extends ImageRenderable {
  #isVideoTopic: boolean;

  public constructor(
    topicName: string,
    renderer: IRenderer,
    userData: ImageUserData,
    {
      isVideoTopic = false,
      isImageMode = false,
    }: { isVideoTopic?: boolean; isImageMode?: boolean },
  ) {
    super(topicName, renderer, userData, {
      isImageMode,
    });
    this.#isVideoTopic = isVideoTopic;
  }

  public handleSeek() {}

  public dispose() {}

  public setImage() {}

  public update() {}
}
