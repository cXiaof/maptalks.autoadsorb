# maptalks-plugin

A simple maptalks plugin scaffolding project.

-maptalks's [plugin development tutorial](https://github.com/maptalks/maptalks.js/wiki)

---

### Logical arrangement

##### setLayer //绑定 layer

    保存layer到私有
    从layer里获取map保存到私有
    监听layer的addgeo事件
        addgeo时更新GeosSet
    监听layer的clear事件
        clear时重置GeosSet
    私有layer置顶
    从map里找\_map_tool
        如果\_map_tool是drawTool
            bindDrawTool

##### bindDrawTool //绑定 drawTool

    保存drawTool到私有
    监听drawTool的enable事件
        enable时组件enable
    监听drawTool的disable事件
        disable时组件disable
    监听drawTool的remove事件
        remove时组件remove

##### enable //组件 enable

    更新GeosSet
    注册map监听事件
    注册drawTool监听事件
    显示私有layer

##### disable //组件 disable

    解除map监听
    解除drawTool监听
    delete私有变量
    隐藏私有layer
    重置GeosSet

##### remove //组件 remove

    组件disable
    移除私有marker
    移除私有layer
    delete私有marker
    delete私有layer

###### updateGeosSet //更新 GeosSet

    获取私有layer上Geometries
    把所有Geometries处理为markersGeoJSON数组

###### registerMapEvents //注册 map 监听事件

    监听map的mousemove事件
        mousemove时 执行私有mousemove事件
    监听map的mousedown事件
        mousedown时 开始更新最近的端点
    监听map的mouseup事件
        mouseup时 停止更新最近的端点

###### mousemoveEvents //私有 mousemove 事件

    保存鼠标位置到私有
    如果已有私有marker则更新到鼠标位置
    如果没有私有marker则以鼠标位置新建
    更新最近的端点

###### updateSnapPoint //更新最近的端点

    找到附近的图形
    更新最近的端点坐标
    将私有marker设置到最近的端点

###### registerDrawToolEvents //注册 drawTool 监听事件

    监听drawTool的drawstart事件
        drawstart时
            重设画的图形的点
            重设点击的点
    监听drawTool的mousemove事件
        mousemove时
            重设画的图形的点
    监听drawTool的drawvertex事件
        drawvertex时
            重设画的图形的点
            重设点击的点
    监听drawTool的drawend事件
        drawend时
            重设画的图形的点
